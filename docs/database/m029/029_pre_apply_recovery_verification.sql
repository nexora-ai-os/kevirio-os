begin read only;
do $$ begin
 if (select count(*) from _m029_recovery.snapshot_control where state='SEALED')<>1 then raise exception 'm029_snapshot_not_sealed';end if;
 if has_schema_privilege('anon','_m029_recovery','USAGE') or has_schema_privilege('authenticated','_m029_recovery','USAGE') or has_schema_privilege('service_role','_m029_recovery','USAGE') then raise exception 'm029_recovery_schema_exposed';end if;
end $$;
with current_rows as(
 select 'clients' t,id,to_jsonb(x) j from public.clients x union all select 'opportunities',id,to_jsonb(x) from public.opportunities x union all select 'owner_decisions',id,to_jsonb(x) from public.owner_decisions x union all select 'campaigns',id,to_jsonb(x) from public.campaigns x union all select 'tasks',id,to_jsonb(x) from public.tasks x union all select 'content_assets',id,to_jsonb(x) from public.content_assets x union all select 'business_memory_records',id,to_jsonb(x) from public.business_memory_records x union all select 'personal_operational_records',id,to_jsonb(x) from public.personal_operational_records x
),cmp as(select count(*) filter(where b.source_id is null or b.row_hash<>encode(extensions.digest(c.j::text,'sha256'),'hex')) mismatches,count(*) current_count from current_rows c left join _m029_recovery.business_rows b on b.source_table=c.t and b.source_id=c.id),sec as(select count(*) n from information_schema.table_privileges where table_schema='_m029_recovery' and grantee in('anon','authenticated','service_role'))
select jsonb_build_object('result',case when cmp.mismatches=0 and cmp.current_count=(select count(*) from _m029_recovery.business_rows) and sec.n=0 then 'M029_PRE_APPLY_RECOVERY_VERIFICATION_PASS' else 'FAIL' end,'business_rows',cmp.current_count,'row_mismatches',cmp.mismatches,'metadata_rows',(select count(*) from _m029_recovery.security_metadata),'browser_privileges',sec.n) verification from cmp,sec;
rollback;
