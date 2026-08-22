begin read only;
with current_pre_shape as(
 select 'clients' t,id,to_jsonb(x)-array['version','data_owner_id','visibility'] j from public.clients x
 union all select 'opportunities',id,to_jsonb(x)-array['visibility'] from public.opportunities x
 union all select 'owner_decisions',id,to_jsonb(x)-array['version','visibility'] from public.owner_decisions x
 union all select 'campaigns',id,to_jsonb(x)-array['data_owner_id','visibility'] from public.campaigns x
 union all select 'tasks',id,to_jsonb(x)-array['version','data_owner_id','visibility'] from public.tasks x
 union all select 'content_assets',id,to_jsonb(x)-array['data_owner_id','visibility'] from public.content_assets x
 union all select 'business_memory_records',id,to_jsonb(x)-array['version','data_owner_id','visibility'] from public.business_memory_records x
 union all select 'personal_operational_records',id,to_jsonb(x)-array['version'] from public.personal_operational_records x
),cmp as(
 select count(*) filter(where c.id is null) missing_rows,
        count(*) filter(where c.id is not null and b.row_hash<>encode(extensions.digest(c.j::text,'sha256'),'hex')) changed_rows,
        count(*) compared_rows
 from _m029_recovery.business_rows b left join current_pre_shape c on c.t=b.source_table and c.id=b.source_id
)
select jsonb_build_object('result',case when missing_rows=0 and changed_rows>0 then 'M029_PRE_RESTORE_DRIFT_PROVEN' else 'FAIL' end,'compared_rows',compared_rows,'changed_rows',changed_rows,'missing_rows',missing_rows,'silent_overwrite',false) verification from cmp;
rollback;
