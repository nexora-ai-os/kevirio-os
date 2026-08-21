-- Read-only verification while the M028 recovery snapshot is retained.
with current_manifest as (
  select count(*)::bigint as memory_rows,
         encode(extensions.digest(coalesce(string_agg(
           concat_ws('|',id,workspace_id,owner_user_id,version,status,content_sha256,
                     extract(epoch from updated_at)), E'\n' order by id),''),'sha256'),'hex') as checksum
  from public.ai_memory_records
), privilege_check as (
  select count(*)::bigint as exposed
  from information_schema.table_privileges
  where table_schema='m028_recovery'
    and grantee in ('PUBLIC','anon','authenticated','service_role')
)
select case when s.memory_rows=c.memory_rows
                  and s.deterministic_checksum=c.checksum
                  and p.exposed=0
            then 'M028_RECOVERY_VERIFICATION_PASS'
            else 'M028_RECOVERY_VERIFICATION_REVIEW_REQUIRED' end as result,
       s.memory_rows as snapshot_rows,
       c.memory_rows as current_rows,
       p.exposed as browser_or_service_privileges
from m028_recovery.snapshot_manifest s
cross join current_manifest c
cross join privilege_check p;
