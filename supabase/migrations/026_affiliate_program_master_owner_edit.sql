begin;

do $$
begin
  if to_regclass('public.affiliate_program_master') is null then
    raise exception 'm026_parent_missing:affiliate_program_master';
  end if;
  if to_regclass('public.company_operating_events') is null then
    raise exception 'm026_parent_missing:company_operating_events';
  end if;
  if to_regprocedure('public.is_canonical_personal_workspace_owner(uuid)') is null then
    raise exception 'm026_owner_boundary_missing';
  end if;
  if to_regprocedure('public.update_affiliate_program_master(uuid,timestamp with time zone,jsonb)') is not null then
    raise exception 'm026_partial_schema_detected';
  end if;
end $$;

alter table public.affiliate_program_master drop constraint affiliate_program_master_program_status_check;
alter table public.affiliate_program_master add constraint affiliate_program_master_program_status_check
  check(program_status in('ACTIVE','PAUSED','ARCHIVED','EXPIRED','UNKNOWN'));

create or replace function public.touch_affiliate_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at=clock_timestamp();
  return new;
end $$;

create function public.update_affiliate_program_master(p_program_master_id uuid,p_expected_updated_at timestamptz,p_changes jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=auth.uid(); v_workspace uuid; v_current public.affiliate_program_master%rowtype;
  v_asp_name text; v_program_id text; v_advertiser_name text; v_program_name text; v_category text;
  v_reward_summary text; v_conversion_conditions text; v_rejection_conditions text; v_compliance_notes text;
  v_source_notes text; v_owner_notes text; v_program_status text; v_event_type text; v_changed_fields jsonb; v_updated_id uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  select apw.workspace_id into v_workspace from public.account_personal_workspaces apw where apw.user_id=v_actor;
  if v_workspace is null or not public.is_canonical_personal_workspace_owner(v_workspace) then raise exception 'canonical_personal_workspace_owner_required'; end if;
  if p_program_master_id is null or p_expected_updated_at is null or p_changes is null or jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb then raise exception 'affiliate_program_update_invalid'; end if;
  if exists(select 1 from jsonb_object_keys(p_changes) as supplied(key) where supplied.key not in(
    'asp_name','program_id','advertiser_name','program_name','category','reward_summary','conversion_conditions',
    'rejection_conditions','compliance_notes','source_notes','owner_notes','program_status'
  )) then raise exception 'affiliate_program_field_not_editable'; end if;
  select apm.* into v_current from public.affiliate_program_master apm where apm.id=p_program_master_id and apm.workspace_id=v_workspace for update;
  if not found then raise exception 'affiliate_program_master_not_found'; end if;
  if v_current.updated_at is distinct from p_expected_updated_at then raise exception 'affiliate_program_stale_update'; end if;
  v_asp_name:=case when p_changes?'asp_name' then btrim(p_changes->>'asp_name') else v_current.asp_name end;
  v_program_id:=case when p_changes?'program_id' then btrim(p_changes->>'program_id') else v_current.program_id end;
  v_advertiser_name:=case when p_changes?'advertiser_name' then btrim(p_changes->>'advertiser_name') else v_current.advertiser_name end;
  v_program_name:=case when p_changes?'program_name' then btrim(p_changes->>'program_name') else v_current.program_name end;
  v_category:=case when p_changes?'category' then nullif(btrim(p_changes->>'category'),'') else v_current.category end;
  v_reward_summary:=case when p_changes?'reward_summary' then nullif(btrim(p_changes->>'reward_summary'),'') else v_current.reward_summary end;
  v_conversion_conditions:=case when p_changes?'conversion_conditions' then nullif(btrim(p_changes->>'conversion_conditions'),'') else v_current.conversion_conditions end;
  v_rejection_conditions:=case when p_changes?'rejection_conditions' then nullif(btrim(p_changes->>'rejection_conditions'),'') else v_current.rejection_conditions end;
  v_compliance_notes:=case when p_changes?'compliance_notes' then nullif(btrim(p_changes->>'compliance_notes'),'') else v_current.compliance_notes end;
  v_source_notes:=case when p_changes?'source_notes' then nullif(btrim(p_changes->>'source_notes'),'') else v_current.source_notes end;
  v_owner_notes:=case when p_changes?'owner_notes' then nullif(btrim(p_changes->>'owner_notes'),'') else v_current.owner_notes end;
  v_program_status:=case when p_changes?'program_status' then upper(btrim(p_changes->>'program_status')) else v_current.program_status end;
  if length(coalesce(v_asp_name,'')) not between 1 and 120 or length(coalesce(v_program_id,'')) not between 1 and 120
    or length(coalesce(v_advertiser_name,'')) not between 1 and 200 or length(coalesce(v_program_name,'')) not between 1 and 500
    or length(coalesce(v_category,''))>200 or length(coalesce(v_reward_summary,''))>4000
    or length(coalesce(v_conversion_conditions,''))>10000 or length(coalesce(v_rejection_conditions,''))>10000
    or length(coalesce(v_compliance_notes,''))>10000 or length(coalesce(v_source_notes,''))>10000
    or length(coalesce(v_owner_notes,''))>10000 then raise exception 'affiliate_program_update_validation_failed'; end if;
  if v_program_status not in('ACTIVE','PAUSED','ARCHIVED','EXPIRED','UNKNOWN') then raise exception 'affiliate_program_status_invalid'; end if;
  update public.affiliate_program_master set asp_name=v_asp_name,program_id=v_program_id,advertiser_name=v_advertiser_name,
    program_name=v_program_name,category=v_category,reward_summary=v_reward_summary,conversion_conditions=v_conversion_conditions,
    rejection_conditions=v_rejection_conditions,compliance_notes=v_compliance_notes,source_notes=v_source_notes,
    owner_notes=v_owner_notes,program_status=v_program_status
  where id=p_program_master_id and workspace_id=v_workspace and updated_at=p_expected_updated_at returning id into v_updated_id;
  if v_updated_id is null then raise exception 'affiliate_program_stale_update'; end if;
  select coalesce(jsonb_agg(keys.key order by keys.key),'[]'::jsonb) into v_changed_fields from jsonb_object_keys(p_changes) as keys(key);
  v_event_type:=case when v_program_status='ARCHIVED' and v_current.program_status<>'ARCHIVED' then 'affiliate_program_archived'
    when v_program_status='PAUSED' and v_current.program_status<>'PAUSED' then 'affiliate_program_paused' else 'affiliate_program_updated' end;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(v_workspace,'affiliate_program_master',v_updated_id,v_event_type,'owner',v_actor::text,
    jsonb_build_object('changed_fields',v_changed_fields,'previous_status',v_current.program_status,'current_status',v_program_status,'external_execution','LOCKED'));
  return v_updated_id;
end $$;

revoke all on function public.update_affiliate_program_master(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.update_affiliate_program_master(uuid,timestamptz,jsonb) to authenticated;
revoke insert,update,delete on table public.affiliate_program_master from authenticated;

commit;
