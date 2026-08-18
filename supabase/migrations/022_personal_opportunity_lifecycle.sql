begin;
create function public.transition_personal_opportunity(p_opportunity_id uuid,p_next_status text,p_create_active_work boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_record public.personal_operational_records; v_current text; v_payload jsonb;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  select * into v_record from public.personal_operational_records where id=p_opportunity_id for update;
  if v_record.id is null or v_record.record_type<>'OPPORTUNITY' or v_record.data_owner_id<>v_user or not public.is_active_workspace_principal(v_record.workspace_id,v_user) then raise exception 'opportunity_not_owned'; end if;
  v_current:=coalesce(v_record.payload->>'status','SAVED');
  if p_next_status not in ('SAVED','EVALUATING','APPLYING','APPLIED','WON','LOST','ARCHIVED') then raise exception 'opportunity_status_invalid'; end if;
  if not ((v_current='SAVED' and p_next_status in ('EVALUATING','ARCHIVED')) or (v_current='EVALUATING' and p_next_status in ('APPLYING','LOST','ARCHIVED')) or (v_current='APPLYING' and p_next_status in ('APPLIED','LOST','ARCHIVED')) or (v_current='APPLIED' and p_next_status in ('WON','LOST','ARCHIVED')) or (v_current in ('WON','LOST') and p_next_status='ARCHIVED') or v_current=p_next_status) then raise exception 'opportunity_transition_invalid'; end if;
  v_payload:=jsonb_set(v_record.payload,'{status}',to_jsonb(p_next_status));
  if p_next_status='WON' and p_create_active_work then v_payload:=jsonb_set(v_payload,'{active_work}',jsonb_build_object('state','ACTIVE','sourceOpportunityId',v_record.id,'createdAt',now()),true); end if;
  update public.personal_operational_records set payload=v_payload,updated_at=now() where id=v_record.id;
  return jsonb_build_object('id',v_record.id,'status',p_next_status,'activeWork',coalesce(v_payload->'active_work','null'::jsonb));
end $$;
revoke all on function public.transition_personal_opportunity(uuid,text,boolean) from public,anon;
grant execute on function public.transition_personal_opportunity(uuid,text,boolean) to authenticated;
commit;
