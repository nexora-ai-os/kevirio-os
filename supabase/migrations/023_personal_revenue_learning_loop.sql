begin;

alter table public.personal_operational_records
  drop constraint personal_operational_records_record_type_check;
alter table public.personal_operational_records
  add constraint personal_operational_records_record_type_check
  check(record_type in ('CONTENT','OPPORTUNITY','FEEDBACK','REVENUE_CANDIDATE','RETROSPECTIVE'));

create unique index personal_revenue_candidate_source_work_unique
  on public.personal_operational_records(data_owner_id,(payload->>'source_work_id'))
  where record_type='REVENUE_CANDIDATE' and lifecycle_status<>'DELETED';
create unique index personal_retrospective_source_unique
  on public.personal_operational_records(data_owner_id,(payload->>'source_type'),(payload->>'source_record_id'))
  where record_type='RETROSPECTIVE' and lifecycle_status<>'DELETED';

create or replace function public.save_personal_operational_record(
  p_workspace_id uuid,p_record_id uuid,p_record_type text,p_title text,p_payload jsonb,
  p_lifecycle_status text default 'DRAFT'
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_payload jsonb:=coalesce(p_payload,'{}'::jsonb);
begin
  if not public.is_active_workspace_principal(p_workspace_id,v_user) then raise exception 'personal_workspace_access_denied'; end if;
  if p_record_type not in ('CONTENT','OPPORTUNITY','FEEDBACK','REVENUE_CANDIDATE','RETROSPECTIVE') then raise exception 'personal_record_type_invalid'; end if;
  if p_lifecycle_status not in ('DRAFT','ACTIVE','ARCHIVED') then raise exception 'personal_record_status_invalid'; end if;
  if octet_length(v_payload::text)>262144
    or v_payload ?| array['password','access_token','refresh_token','service_role_key','authorization','cookie'] then
    raise exception 'personal_record_payload_rejected';
  end if;
  if p_record_type='REVENUE_CANDIDATE' then
    if coalesce(v_payload->>'source_work_id','')='' or coalesce(v_payload->>'source_opportunity_id','')=''
      or coalesce(v_payload->>'truth_state','') not in ('FORECAST','UNKNOWN')
      or v_payload ? 'actual' or v_payload ? 'actual_amount_minor' then
      raise exception 'revenue_candidate_contract_invalid';
    end if;
  end if;
  if p_record_type='RETROSPECTIVE' then
    if coalesce(v_payload->>'source_type','') not in ('WORK','REVENUE_CANDIDATE')
      or coalesce(v_payload->>'source_record_id','')=''
      or coalesce(v_payload->>'knowledge_class','')<>'PERSONAL'
      or coalesce(v_payload->>'claim_class','')<>'USER_REPORTED_LEARNING' then
      raise exception 'retrospective_contract_invalid';
    end if;
  end if;
  if p_record_id is null then
    insert into public.personal_operational_records(workspace_id,data_owner_id,record_type,title,payload,lifecycle_status)
    values(p_workspace_id,v_user,p_record_type,left(coalesce(p_title,''),240),v_payload,p_lifecycle_status)
    returning id into v_id;
  else
    update public.personal_operational_records set title=left(coalesce(p_title,''),240),payload=v_payload,lifecycle_status=p_lifecycle_status,updated_at=now()
    where id=p_record_id and workspace_id=p_workspace_id and data_owner_id=v_user and record_type=p_record_type
    returning id into v_id;
    if v_id is null then raise exception 'personal_record_not_owned'; end if;
  end if;
  return v_id;
end $$;

revoke all on function public.save_personal_operational_record(uuid,uuid,text,text,jsonb,text) from public,anon;
grant execute on function public.save_personal_operational_record(uuid,uuid,text,text,jsonb,text) to authenticated;

commit;
