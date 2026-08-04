begin transaction read only;

with
expected as (
  select '47B84532D42C327B7A59424062E7E71FB00C1338CA94F2555FFC02CB49B99F10'::text as migration_sha256
),
required_parents(name) as (values
  ('workspaces'),('workspace_members'),('owner_profiles'),('affiliate_offers'),('offer_operations'),
  ('revenue_engines'),('content_assets'),('execution_packages'),('evidence_candidates'),
  ('revenue_records'),('operating_cost_records'),('company_operating_events')
),
target_tables(name) as (values('affiliate_programs'),('affiliate_materials'),('affiliate_publications'),('affiliate_performance_records')),
target_indexes(name) as (values
  ('affiliate_programs_workspace_status_idx'),('affiliate_materials_workspace_program_status_idx'),
  ('affiliate_publications_workspace_program_status_idx'),('affiliate_performance_workspace_program_period_idx')
),
target_constraints(table_name,name) as (values
  ('affiliate_offers','affiliate_offers_id_workspace_unique'),('revenue_engines','revenue_engines_id_workspace_unique'),
  ('content_assets','content_assets_id_workspace_unique'),('execution_packages','execution_packages_id_workspace_unique'),
  ('evidence_candidates','evidence_candidates_id_workspace_unique')
),
checks(check_group,object_name,check_name,status,expected_value,actual_value,detail) as (
  select 'freeze','014_affiliate_intelligence.sql','expected_sha256','PASS',migration_sha256,migration_sha256,'Compare this value with the SHA-256 of the saved migration file before apply.' from expected
  union all
  select 'extension','pgcrypto','required',case when exists(select 1 from pg_extension where extname='pgcrypto') then 'PASS' else 'FAIL' end,'present',case when exists(select 1 from pg_extension where extname='pgcrypto') then 'present' else 'missing' end,'Migration requires gen_random_uuid and digest-capable foundation.'
  union all
  select 'parent',name,'exists',case when to_regclass(format('public.%I',name)) is not null then 'PASS' else 'FAIL' end,'present',coalesce(to_regclass(format('public.%I',name))::text,'missing'),'All canonical parents must exist.' from required_parents
  union all
  select 'function','is_active_workspace_member(uuid)','exists',case when to_regprocedure('public.is_active_workspace_member(uuid)') is not null then 'PASS' else 'FAIL' end,'present',coalesce(to_regprocedure('public.is_active_workspace_member(uuid)')::text,'missing'),'Owner workspace helper is required.'
  union all
  select 'function','ai_metadata_is_safe(jsonb,integer)','exists',case when to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)') is not null then 'PASS' else 'FAIL' end,'present',coalesce(to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)')::text,'missing'),'Safe metadata validator is required.'
  union all
  select 'collision',name,'table_absent',case when to_regclass(format('public.%I',name)) is null then 'PASS' else 'FAIL' end,'absent',coalesce(to_regclass(format('public.%I',name))::text,'absent'),'Any target table means not-applicable or partial schema; STOP.' from target_tables
  union all
  select 'collision','save_affiliate_program_draft(uuid,jsonb,integer,text)','function_absent',case when to_regprocedure('public.save_affiliate_program_draft(uuid,jsonb,integer,text)') is null then 'PASS' else 'FAIL' end,'absent',coalesce(to_regprocedure('public.save_affiliate_program_draft(uuid,jsonb,integer,text)')::text,'absent'),'Function collision must fail closed.'
  union all
  select 'collision','touch_affiliate_updated_at()','function_absent',case when to_regprocedure('public.touch_affiliate_updated_at()') is null then 'PASS' else 'FAIL' end,'absent',coalesce(to_regprocedure('public.touch_affiliate_updated_at()')::text,'absent'),'Function collision must fail closed.'
  union all
  select 'collision','affiliate_touch_updated_at','trigger_absent',case when not exists(select 1 from pg_trigger where tgname='affiliate_touch_updated_at' and not tgisinternal) then 'PASS' else 'FAIL' end,'absent',(select count(*)::text from pg_trigger where tgname='affiliate_touch_updated_at' and not tgisinternal),'Trigger collision must fail closed.'
  union all
  select 'collision','affiliate_owner_read','policy_absent',case when not exists(select 1 from pg_policy where polname='affiliate_owner_read') then 'PASS' else 'FAIL' end,'absent',(select count(*)::text from pg_policy where polname='affiliate_owner_read'),'Policy collision must fail closed.'
  union all
  select 'collision',name,'index_absent',case when not exists(select 1 from pg_class where relkind='i' and relname=name) then 'PASS' else 'FAIL' end,'absent',(select count(*)::text from pg_class where relkind='i' and relname=target_indexes.name),'Index collision must fail closed.' from target_indexes
  union all
  select 'constraint',table_name||'.'||name,'compatible_or_absent',case when not exists(select 1 from pg_constraint where conrelid=format('public.%I',table_name)::regclass and conname=name) or exists(select 1 from pg_constraint where conrelid=format('public.%I',table_name)::regclass and conname=name and contype='u' and pg_get_constraintdef(oid,true)='UNIQUE (id, workspace_id)') then 'PASS' else 'FAIL' end,'absent or UNIQUE (id, workspace_id)',coalesce((select pg_get_constraintdef(oid,true) from pg_constraint where conrelid=format('public.%I',table_name)::regclass and conname=target_constraints.name),'absent'),'Named parent constraint must not collide incompatibly.' from target_constraints
  union all
  select 'ownership',name,'migration_executor_owns_parent',case when to_regclass(format('public.%I',name)) is not null and pg_get_userbyid(c.relowner)=current_user then 'PASS' else 'FAIL' end,current_user,coalesce(pg_get_userbyid(c.relowner),'missing'),'Migration must be able to add a composite unique constraint.' from required_parents p left join pg_class c on c.oid=to_regclass(format('public.%I',p.name)) where p.name in('affiliate_offers','revenue_engines','content_assets','execution_packages','evidence_candidates')
  union all
  select 'compatibility','affiliate_offers','existing_rows_preserved','PASS','no mutation',count(*)::text,'Existing RingConn and all other Offer rows are read only during pre-check and are not seeded by Migration 014.' from public.affiliate_offers
),
summary as (
  select count(*) filter(where status='PASS') pass_count,count(*) filter(where status='FAIL') fail_count,count(*) filter(where status='WARN') warn_count from checks
),
result as (
  select check_group,object_name,check_name,status,expected_value,actual_value,detail,0 sort_order from checks
  union all
  select 'SUMMARY','M014_PRE_APPLY','overall_status',case when fail_count=0 then 'PASS' else 'FAIL' end,
    'fail_count=0; READ_ONLY_ROLLBACK; external_execution=LOCKED',
    format('pass_count=%s; fail_count=%s; warn_count=%s',pass_count,fail_count,warn_count),
    case when fail_count=0 then 'M014_PRE_APPLY_CHECKS_PASS' else 'M014_PRE_APPLY_CHECKS_FAIL_STOP' end,1 from summary
)
select check_group,object_name,check_name,status,expected_value,actual_value,detail from result order by sort_order,check_group,object_name,check_name;

rollback;
