begin;

do $$
declare required_name text;
begin
  foreach required_name in array array[
    'account_personal_workspaces','workspaces','workspace_members','owner_profiles','user_account_states',
    'affiliate_programs','affiliate_publications','affiliate_performance_records','affiliate_program_master',
    'revenue_records','operating_cost_records','company_operating_events'
  ] loop
    if to_regclass(format('public.%I',required_name)) is null then
      raise exception 'm025_parent_missing:%',required_name;
    end if;
  end loop;
  if to_regprocedure('public.resolve_personal_workspace()') is null then
    raise exception 'm025_personal_workspace_resolver_missing';
  end if;
end $$;

create function public.is_canonical_personal_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select auth.role()='authenticated' and exists(
    select 1
    from public.account_personal_workspaces apw
    join public.workspaces w on w.id=apw.workspace_id and w.status='active'
    join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=apw.user_id and wm.role='owner' and wm.status='active'
    join public.owner_profiles op on op.owner_id=apw.user_id and op.role='owner' and op.status='active'
    join public.user_account_states uas on uas.user_id=apw.user_id and uas.lifecycle_state='ACTIVE'
    where apw.user_id=auth.uid() and apw.workspace_id=p_workspace_id
  );
$$;

revoke all on function public.is_canonical_personal_workspace_owner(uuid) from public,anon;
grant execute on function public.is_canonical_personal_workspace_owner(uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['affiliate_programs','affiliate_publications','affiliate_performance_records'] loop
    execute format('drop policy if exists affiliate_owner_read on public.%I',table_name);
    execute format('create policy affiliate_personal_owner_read on public.%I for select to authenticated using (public.is_canonical_personal_workspace_owner(workspace_id))',table_name);
  end loop;
  foreach table_name in array array['affiliate_products','affiliate_product_sources','affiliate_research_entities','affiliate_experiments','affiliate_intelligence_snapshots','affiliate_risk_findings','affiliate_alerts','affiliate_daily_briefs','reusable_business_assets'] loop
    execute format('drop policy if exists affiliate_v2_owner_read on public.%I',table_name);
    execute format('create policy affiliate_personal_owner_read on public.%I for select to authenticated using (public.is_canonical_personal_workspace_owner(workspace_id))',table_name);
  end loop;
end $$;

drop policy if exists affiliate_program_master_owner_read on public.affiliate_program_master;
create policy affiliate_program_master_personal_owner_read on public.affiliate_program_master
  for select to authenticated using(public.is_canonical_personal_workspace_owner(workspace_id));

drop policy if exists revenue_records_member_select on public.revenue_records;
create policy revenue_records_personal_owner_select on public.revenue_records
  for select to authenticated using(public.is_canonical_personal_workspace_owner(workspace_id));

drop policy if exists operating_cost_records_owner_select on public.operating_cost_records;
create policy operating_cost_records_personal_owner_select on public.operating_cost_records
  for select to authenticated using(public.is_canonical_personal_workspace_owner(workspace_id));

grant select on table public.affiliate_programs,public.affiliate_publications,public.affiliate_performance_records,public.affiliate_program_master,public.revenue_records,public.operating_cost_records to authenticated;
revoke insert,update,delete on table public.affiliate_programs,public.affiliate_publications,public.affiliate_performance_records,public.affiliate_program_master,public.revenue_records,public.operating_cost_records from authenticated;

create function public.register_affiliate_program_master(
  p_asp_name text,
  p_program_id text,
  p_advertiser_name text,
  p_program_name text,
  p_category text default null,
  p_source_notes text default null
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_workspace uuid;
  v_id uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  select apw.workspace_id into v_workspace from public.account_personal_workspaces apw where apw.user_id=v_actor;
  if v_workspace is null or not public.is_canonical_personal_workspace_owner(v_workspace) then raise exception 'canonical_personal_workspace_owner_required'; end if;
  if length(btrim(coalesce(p_asp_name,''))) not between 1 and 120
    or length(btrim(coalesce(p_program_id,''))) not between 1 and 120
    or length(btrim(coalesce(p_advertiser_name,''))) not between 1 and 200
    or length(btrim(coalesce(p_program_name,''))) not between 1 and 500
    or length(coalesce(p_category,''))>200
    or length(coalesce(p_source_notes,''))>1000 then raise exception 'affiliate_program_input_invalid'; end if;
  insert into public.affiliate_program_master(
    workspace_id,asp_name,program_id,advertiser_name,program_name,category,reward_type,
    listing_policy,listing_ng_words_verification_status,program_status,affiliate_link_status,
    source_type,source_notes,external_execution_allowed,created_by
  ) values(
    v_workspace,btrim(p_asp_name),btrim(p_program_id),btrim(p_advertiser_name),btrim(p_program_name),nullif(btrim(p_category),''),'UNKNOWN',
    'UNKNOWN','UNKNOWN','UNKNOWN','NOT_REGISTERED','OWNER_MANUAL',nullif(btrim(p_source_notes),''),false,v_actor
  ) returning id into v_id;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(v_workspace,'affiliate_program_master',v_id,'affiliate_program_master_registered','owner',v_actor::text,jsonb_build_object('source_type','OWNER_MANUAL','external_execution','LOCKED'));
  return v_id;
end $$;

create or replace function public.save_affiliate_program_master_link(p_workspace_id uuid,p_program_master_id uuid,p_affiliate_url text,p_link_status text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_url text:=nullif(btrim(p_affiliate_url),''); v_status text:=coalesce(nullif(btrim(p_link_status),''),'NOT_REGISTERED'); v_id uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  if not public.is_canonical_personal_workspace_owner(p_workspace_id) then raise exception 'canonical_personal_workspace_owner_required'; end if;
  if v_url is null then v_status:='NOT_REGISTERED';
  elsif v_url!~'^https?://[^[:space:]]{1,1990}$' then raise exception 'affiliate_url_invalid';
  elsif v_status not in('ACTIVE','PAUSED','EXPIRED') then raise exception 'affiliate_link_status_invalid'; end if;
  update public.affiliate_program_master set affiliate_url=v_url,affiliate_link_status=v_status,affiliate_url_updated_at=now(),affiliate_url_updated_by=v_actor
  where id=p_program_master_id and workspace_id=p_workspace_id returning id into v_id;
  if v_id is null then raise exception 'affiliate_program_master_not_found'; end if;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(p_workspace_id,'affiliate_program_master',v_id,'affiliate_program_link_updated','owner',v_actor::text,jsonb_build_object('link_status',v_status,'external_execution','LOCKED'));
  return v_id;
end $$;

revoke all on function public.register_affiliate_program_master(text,text,text,text,text,text) from public,anon;
grant execute on function public.register_affiliate_program_master(text,text,text,text,text,text) to authenticated;
revoke all on function public.save_affiliate_program_master_link(uuid,uuid,text,text) from public,anon;
grant execute on function public.save_affiliate_program_master_link(uuid,uuid,text,text) to authenticated;

commit;
