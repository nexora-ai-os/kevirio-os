begin;

do $m033_preflight$
begin
  if to_regclass('public.affiliate_program_master') is null then raise exception 'm033_affiliate_program_master_missing'; end if;
  if to_regprocedure('public.save_affiliate_program_master_link(uuid,uuid,text,text)') is null then raise exception 'm033_m025_link_rpc_missing'; end if;
  if to_regprocedure('public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamp with time zone,bigint)') is not null then raise exception 'm033_existing_or_partial_state'; end if;
  if not exists(select 1 from pg_constraint where conrelid='public.affiliate_program_master'::regclass and conname='affiliate_program_master_url_check' and pg_get_constraintdef(oid) like '%{1,1990}%') then raise exception 'm033_expected_broken_constraint_not_found'; end if;
end $m033_preflight$;

alter table public.affiliate_program_master drop constraint affiliate_program_master_url_check;
alter table public.affiliate_program_master add constraint affiliate_program_master_url_check check(
  affiliate_url is null or (
    length(affiliate_url) between 8 and 2000
    and affiliate_url ~ '^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$'
  )
);

create function public.save_affiliate_program_master_link(
  p_workspace_id uuid,
  p_program_master_id uuid,
  p_affiliate_url text,
  p_link_status text,
  p_expected_updated_at timestamptz,
  p_expected_business_version bigint
) returns table(program_id uuid,updated_at timestamptz,business_version bigint)
language plpgsql security definer set search_path='' as $m033_link$
declare
  v_actor uuid:=auth.uid();
  v_url text:=nullif(btrim(p_affiliate_url),'');
  v_status text:=coalesce(nullif(btrim(p_link_status),''),'NOT_REGISTERED');
  v_current public.affiliate_program_master%rowtype;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'm033_owner_authentication_required'; end if;
  if p_workspace_id is null or p_program_master_id is null or p_expected_updated_at is null or p_expected_business_version is null then raise exception 'm033_link_request_invalid'; end if;
  if not exists(select 1 from public.account_personal_workspaces x where x.user_id=v_actor and x.workspace_id=p_workspace_id)
    or not public.is_canonical_personal_workspace_owner(p_workspace_id) then raise exception 'm033_personal_owner_required'; end if;
  if v_url is null then v_status:='NOT_REGISTERED';
  elsif length(v_url) not between 8 and 2000
    or v_url !~ '^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$' then raise exception 'm033_affiliate_url_invalid';
  elsif v_status not in('ACTIVE','PAUSED','EXPIRED') then raise exception 'm033_affiliate_link_status_invalid'; end if;

  select * into v_current from public.affiliate_program_master x
  where x.id=p_program_master_id and x.workspace_id=p_workspace_id for update;
  if not found then raise exception 'm033_affiliate_program_not_found'; end if;
  if v_current.updated_at is distinct from p_expected_updated_at or v_current.business_version<>p_expected_business_version then raise exception 'm033_stale_link_update'; end if;

  update public.affiliate_program_master x set
    affiliate_url=v_url,
    affiliate_link_status=v_status,
    affiliate_url_updated_at=clock_timestamp(),
    affiliate_url_updated_by=v_actor,
    business_version=x.business_version+1
  where x.id=p_program_master_id and x.workspace_id=p_workspace_id
    and x.updated_at=p_expected_updated_at and x.business_version=p_expected_business_version
  returning x.id,x.updated_at,x.business_version into program_id,updated_at,business_version;
  if program_id is null then raise exception 'm033_stale_link_update'; end if;

  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(p_workspace_id,'affiliate_program_master',program_id,'affiliate_program_link_updated','owner',v_actor::text,
    jsonb_build_object('link_status',v_status,'business_version',business_version,'paid_ai_jpy',0,'external_execution','LOCKED'));
  return next;
end $m033_link$;

revoke all on function public.save_affiliate_program_master_link(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamptz,bigint) from public,anon;
grant execute on function public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamptz,bigint) to authenticated;
alter function public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamptz,bigint) owner to postgres;

commit;
