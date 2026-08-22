-- F. Reimport accepted data. Independent SQL Editor execution unit.
begin;
do $reimport$
declare o record;
begin
 for o in select distinct owner_user_id from public._m029_recovery_canonical_versions loop
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claim.sub',o.owner_user_id::text,true);
  update public.clients t set version=r.version,data_owner_id=r.owner_user_id,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='clients' and t.id=r.id;
  update public.opportunities t set version=r.version,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='opportunities' and t.id=r.id and t.created_by=r.owner_user_id;
  update public.owner_decisions t set version=r.version,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='owner_decisions' and t.id=r.id and t.decided_by=r.owner_user_id;
  update public.campaigns t set version=r.version,data_owner_id=r.owner_user_id,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='campaigns' and t.id=r.id;
  update public.tasks t set version=r.version,data_owner_id=r.owner_user_id,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='tasks' and t.id=r.id;
  update public.content_assets t set version=r.version,data_owner_id=r.owner_user_id,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='content_assets' and t.id=r.id;
  update public.business_memory_records t set version=r.version,data_owner_id=r.owner_user_id,visibility=r.visibility from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='business_memory_records' and t.id=r.id;
  update public.personal_operational_records t set version=r.version from public._m029_recovery_canonical_versions r where r.owner_user_id=o.owner_user_id and r.table_name='personal_operational_records' and t.id=r.id and t.data_owner_id=r.owner_user_id;
 end loop;
end $reimport$;
insert into public.canonical_domain_drafts select * from public._m029_recovery_drafts on conflict(id) do update set payload=excluded.payload,draft_version=excluded.draft_version,base_object_version=excluded.base_object_version,updated_at=excluded.updated_at;
insert into public.canonical_domain_conversions select * from public._m029_recovery_conversions on conflict(id) do nothing;
commit;
select jsonb_build_object('result','M029_ACCEPTED_DATA_REIMPORT_PASS','drafts',(select count(*) from public.canonical_domain_drafts),'conversions',(select count(*) from public.canonical_domain_conversions)) verification;
