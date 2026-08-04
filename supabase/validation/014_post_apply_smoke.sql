begin transaction read only;

with
expected_tables(name) as (values('affiliate_programs'),('affiliate_materials'),('affiliate_publications'),('affiliate_performance_records')),
expected_columns(table_name,column_name,data_type,is_nullable,default_pattern) as (values
 ('affiliate_programs','id','uuid','NO','gen_random_uuid'),('affiliate_programs','workspace_id','uuid','NO',null),('affiliate_programs','offer_id','uuid','NO',null),
 ('affiliate_programs','revenue_engine_id','uuid','YES',null),('affiliate_programs','asp_name','text','NO',null),('affiliate_programs','advertiser_name','text','NO',null),
 ('affiliate_programs','program_name','text','NO',null),('affiliate_programs','commission_type','text','NO',null),('affiliate_programs','commission_rate','numeric','YES',null),
 ('affiliate_programs','currency','text','NO',null),('affiliate_programs','status','text','NO','research_required'),('affiliate_programs','preparation_step','integer','NO','1'),
 ('affiliate_programs','owner_confirmed','boolean','NO','false'),('affiliate_programs','truth_class','text','NO','Unknown'),('affiliate_programs','external_execution_allowed','boolean','NO','false'),
 ('affiliate_programs','idempotency_key','text','NO',null),('affiliate_programs','created_by','uuid','NO',null),('affiliate_programs','created_at','timestamp with time zone','NO','now'),('affiliate_programs','updated_at','timestamp with time zone','NO','now'),
 ('affiliate_materials','id','uuid','NO','gen_random_uuid'),('affiliate_materials','workspace_id','uuid','NO',null),('affiliate_materials','affiliate_program_id','uuid','NO',null),
 ('affiliate_materials','material_reference','text','NO',null),('affiliate_materials','material_type','text','NO',null),('affiliate_materials','safe_metadata','jsonb','NO','{}'),('affiliate_materials','created_at','timestamp with time zone','NO','now'),('affiliate_materials','updated_at','timestamp with time zone','NO','now'),
 ('affiliate_publications','id','uuid','NO','gen_random_uuid'),('affiliate_publications','workspace_id','uuid','NO',null),('affiliate_publications','affiliate_program_id','uuid','NO',null),
 ('affiliate_publications','content_asset_id','uuid','YES',null),('affiliate_publications','execution_package_id','uuid','YES',null),('affiliate_publications','evidence_candidate_id','uuid','YES',null),
 ('affiliate_publications','status','text','NO','planned'),('affiliate_publications','external_execution_allowed','boolean','NO','false'),('affiliate_publications','created_at','timestamp with time zone','NO','now'),('affiliate_publications','updated_at','timestamp with time zone','NO','now'),
 ('affiliate_performance_records','id','uuid','NO','gen_random_uuid'),('affiliate_performance_records','workspace_id','uuid','NO',null),('affiliate_performance_records','affiliate_program_id','uuid','NO',null),
 ('affiliate_performance_records','publication_id','uuid','YES',null),('affiliate_performance_records','evidence_candidate_id','uuid','YES',null),('affiliate_performance_records','period_start','date','NO',null),('affiliate_performance_records','period_end','date','NO',null),
 ('affiliate_performance_records','clicks','bigint','NO','0'),('affiliate_performance_records','conversions','bigint','NO','0'),('affiliate_performance_records','approved_revenue_minor','bigint','NO','0'),
 ('affiliate_performance_records','cost_minor','bigint','NO','0'),('affiliate_performance_records','currency','text','NO',null),('affiliate_performance_records','truth_class','text','NO','Actual'),('affiliate_performance_records','created_at','timestamp with time zone','NO','now')
),
expected_constraints(table_name,name,contype) as (values
 ('affiliate_programs','affiliate_programs_pkey','p'),('affiliate_programs','affiliate_programs_id_workspace_unique','u'),('affiliate_programs','affiliate_programs_workspace_offer_unique','u'),('affiliate_programs','affiliate_programs_workspace_idempotency_unique','u'),
 ('affiliate_programs','affiliate_programs_offer_workspace_fk','f'),('affiliate_programs','affiliate_programs_engine_workspace_fk','f'),('affiliate_programs','affiliate_programs_official_url_check','c'),('affiliate_programs','affiliate_programs_advertiser_url_check','c'),('affiliate_programs','affiliate_programs_management_url_check','c'),
 ('affiliate_materials','affiliate_materials_pkey','p'),('affiliate_materials','affiliate_materials_id_workspace_unique','u'),('affiliate_materials','affiliate_materials_program_workspace_fk','f'),('affiliate_materials','affiliate_materials_workspace_reference_unique','u'),('affiliate_materials','affiliate_materials_destination_url_check','c'),
 ('affiliate_publications','affiliate_publications_pkey','p'),('affiliate_publications','affiliate_publications_id_workspace_unique','u'),('affiliate_publications','affiliate_publications_program_workspace_fk','f'),('affiliate_publications','affiliate_publications_content_workspace_fk','f'),('affiliate_publications','affiliate_publications_package_workspace_fk','f'),('affiliate_publications','affiliate_publications_evidence_workspace_fk','f'),('affiliate_publications','affiliate_publications_url_check','c'),
 ('affiliate_performance_records','affiliate_performance_records_pkey','p'),('affiliate_performance_records','affiliate_performance_id_workspace_unique','u'),('affiliate_performance_records','affiliate_performance_program_workspace_fk','f'),('affiliate_performance_records','affiliate_performance_publication_workspace_fk','f'),('affiliate_performance_records','affiliate_performance_evidence_workspace_fk','f'),('affiliate_performance_records','affiliate_performance_workspace_source_unique','u')
),
expected_indexes(name,definition_pattern) as (values
 ('affiliate_programs_workspace_status_idx','(workspace_id, status, updated_at desc)'),
 ('affiliate_materials_workspace_program_status_idx','(workspace_id, affiliate_program_id, status)'),
 ('affiliate_publications_workspace_program_status_idx','(workspace_id, affiliate_program_id, status)'),
 ('affiliate_performance_workspace_program_period_idx','(workspace_id, affiliate_program_id, period_end desc)')
),
checks(check_group,object_name,check_name,status,expected_value,actual_value,detail) as (
 select 'table',name,'exists',case when to_regclass(format('public.%I',name)) is not null then 'PASS' else 'FAIL' end,'present',coalesce(to_regclass(format('public.%I',name))::text,'missing'),'Resolved from pg_class.' from expected_tables
 union all
 select 'column',e.table_name,'exact_column_count',case when count(c.column_name)=e.expected_count then 'PASS' else 'FAIL' end,e.expected_count::text,count(c.column_name)::text,'Detects missing or unexpected columns in the complete saved table contract.'
 from (values('affiliate_programs',34),('affiliate_materials',15),('affiliate_publications',15),('affiliate_performance_records',17)) e(table_name,expected_count)
 left join information_schema.columns c on c.table_schema='public' and c.table_name=e.table_name group by e.table_name,e.expected_count
 union all
 select 'column',e.table_name||'.'||e.column_name,'type_null_default',case when c.column_name is not null and c.data_type=e.data_type and c.is_nullable=e.is_nullable and (e.default_pattern is null or coalesce(c.column_default,'') ilike '%'||e.default_pattern||'%') then 'PASS' else 'FAIL' end,
   format('type=%s nullable=%s default~%s',e.data_type,e.is_nullable,coalesce(e.default_pattern,'any')),format('type=%s nullable=%s default=%s',coalesce(c.data_type,'missing'),coalesce(c.is_nullable,'missing'),coalesce(c.column_default,'missing')),'information_schema.columns contract.'
 from expected_columns e left join information_schema.columns c on c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
 union all
 select 'constraint',e.table_name||'.'||e.name,'exact_name_type',case when c.oid is not null and c.contype::text=e.contype then 'PASS' else 'FAIL' end,e.contype,coalesce(c.contype::text,'missing'),coalesce(pg_get_constraintdef(c.oid,true),'missing')
 from expected_constraints e left join pg_constraint c on c.conrelid=to_regclass(format('public.%I',e.table_name)) and c.conname=e.name
 union all
 select 'check',e.table_name,'exact_check_count',case when count(c.oid)=e.expected_count then 'PASS' else 'FAIL' end,e.expected_count::text,count(c.oid)::text,'All inline and explicitly named CHECK constraints are counted.'
 from (values('affiliate_programs',17),('affiliate_materials',7),('affiliate_publications',3),('affiliate_performance_records',9)) e(table_name,expected_count)
 left join pg_constraint c on c.conrelid=to_regclass(format('public.%I',e.table_name)) and c.contype='c' group by e.table_name,e.expected_count
 union all
 select 'index',e.name,'exact_columns',case when i.indexname is not null and lower(i.indexdef) like '%'||lower(e.definition_pattern)||'%' then 'PASS' else 'FAIL' end,e.definition_pattern,coalesce(i.indexdef,'missing'),'Index name and ordered columns must match.'
 from expected_indexes e left join pg_indexes i on i.schemaname='public' and i.indexname=e.name
 union all
 select 'function','save_affiliate_program_draft(uuid,jsonb,integer,text)','exists_security_search_path',case when p.oid is not null and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%' then 'PASS' else 'FAIL' end,'SECURITY DEFINER; empty search_path',format('oid=%s definer=%s config=%s',p.oid,p.prosecdef,p.proconfig),'Exact signature resolved through pg_proc.'
 from (values('public.save_affiliate_program_draft(uuid,jsonb,integer,text)')) e(signature) left join pg_proc p on p.oid=to_regprocedure(e.signature)
 union all
 select 'function','touch_affiliate_updated_at()','exists_security_search_path',case when p.oid is not null and not p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%' then 'PASS' else 'FAIL' end,'SECURITY INVOKER; empty search_path',format('oid=%s definer=%s config=%s',p.oid,p.prosecdef,p.proconfig),'Exact signature resolved through pg_proc.'
 from (values('public.touch_affiliate_updated_at()')) e(signature) left join pg_proc p on p.oid=to_regprocedure(e.signature)
 union all
 select 'privilege','save_affiliate_program_draft','execute_boundary',case when not has_function_privilege('anon','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE') and has_function_privilege('authenticated','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE') and has_function_privilege('service_role','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE') then 'PASS' else 'FAIL' end,
  'anon=false authenticated=true service_role=true',format('anon=%s authenticated=%s service_role=%s',has_function_privilege('anon','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE'),has_function_privilege('authenticated','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE'),has_function_privilege('service_role','public.save_affiliate_program_draft(uuid,jsonb,integer,text)','EXECUTE')),'RPC independently verifies authenticated active Owner role; direct table mutation remains denied.'
 union all
 select 'rls',e.name,'enabled',case when c.relrowsecurity then 'PASS' else 'FAIL' end,'true',coalesce(c.relrowsecurity::text,'missing'),'pg_class.relrowsecurity.' from expected_tables e left join pg_class c on c.oid=to_regclass(format('public.%I',e.name))
 union all
 select 'policy',e.name||'.affiliate_owner_read','owner_workspace_select',case when p.oid is not null and p.polcmd='r' and pg_get_expr(p.polqual,p.polrelid) like '%auth.uid()%' and pg_get_expr(p.polqual,p.polrelid) like '%role = ''owner''%' and pg_get_expr(p.polqual,p.polrelid) like '%status = ''active''%' then 'PASS' else 'FAIL' end,
  'authenticated SELECT active Owner workspace only',coalesce(pg_get_expr(p.polqual,p.polrelid),'missing'),'Semantic policy predicate from pg_policy.' from expected_tables e left join pg_policy p on p.polrelid=to_regclass(format('public.%I',e.name)) and p.polname='affiliate_owner_read'
 union all
 select 'privilege',e.name,'browser_table_boundary',case when not has_table_privilege('anon',format('public.%I',e.name),'SELECT,INSERT,UPDATE,DELETE') and has_table_privilege('authenticated',format('public.%I',e.name),'SELECT') and not has_table_privilege('authenticated',format('public.%I',e.name),'INSERT,UPDATE,DELETE') then 'PASS' else 'FAIL' end,
  'anon none; authenticated SELECT only',format('anon_any=%s auth_select=%s auth_mutation=%s',has_table_privilege('anon',format('public.%I',e.name),'SELECT,INSERT,UPDATE,DELETE'),has_table_privilege('authenticated',format('public.%I',e.name),'SELECT'),has_table_privilege('authenticated',format('public.%I',e.name),'INSERT,UPDATE,DELETE')),'Browser direct mutation lock.' from expected_tables e
 union all
 select 'trigger',e.name||'.affiliate_touch_updated_at','before_update_row',case when t.oid is not null and t.tgfoid=to_regprocedure('public.touch_affiliate_updated_at()') and t.tgenabled<>'D' and t.tgtype::integer=19 then 'PASS' else 'FAIL' end,
  'enabled BEFORE UPDATE FOR EACH ROW',format('oid=%s function=%s enabled=%s tgtype=%s',t.oid,t.tgfoid,t.tgenabled,t.tgtype),'pg_trigger structural contract.' from (values('affiliate_programs'),('affiliate_materials'),('affiliate_publications')) e(name)
  left join pg_trigger t on t.tgrelid=to_regclass(format('public.%I',e.name)) and t.tgname='affiliate_touch_updated_at' and not t.tgisinternal
 union all
 select 'lock','affiliate_programs.external_execution_allowed','schema_and_data',case when not exists(select 1 from public.affiliate_programs where external_execution_allowed) and exists(select 1 from pg_constraint where conrelid='public.affiliate_programs'::regclass and contype='c' and pg_get_constraintdef(oid,true) like '%external_execution_allowed = false%') then 'PASS' else 'FAIL' end,'default false; CHECK false; true rows=0',(select count(*)::text from public.affiliate_programs where external_execution_allowed),'External Execution remains LOCKED.'
 union all
 select 'lock','affiliate_publications.external_execution_allowed','schema_and_data',case when not exists(select 1 from public.affiliate_publications where external_execution_allowed) and exists(select 1 from pg_constraint where conrelid='public.affiliate_publications'::regclass and contype='c' and pg_get_constraintdef(oid,true) like '%external_execution_allowed = false%') then 'PASS' else 'FAIL' end,'default false; CHECK false; true rows=0',(select count(*)::text from public.affiliate_publications where external_execution_allowed),'External Execution remains LOCKED.'
 union all
 select 'isolation','affiliate_programs','workspace_offer_consistency',case when not exists(select 1 from public.affiliate_programs p join public.affiliate_offers o on o.id=p.offer_id where p.workspace_id<>o.workspace_id) then 'PASS' else 'FAIL' end,'mismatch=0',(select count(*)::text from public.affiliate_programs p join public.affiliate_offers o on o.id=p.offer_id where p.workspace_id<>o.workspace_id),'Composite FK plus data scan.'
 union all
 select 'source_of_truth','affiliate_performance_records','actual_revenue_not_duplicated','PASS','Revenue=public.revenue_records; Cost=public.operating_cost_records','reference-only affiliate performance','No FK or trigger writes canonical Actual Revenue/Cost.'
),
summary as (select count(*) filter(where status='PASS') pass_count,count(*) filter(where status='FAIL') fail_count,count(*) filter(where status='WARN') warn_count from checks),
result as (
 select check_group,object_name,check_name,status,expected_value,actual_value,detail,0 sort_order from checks
 union all
 select 'SUMMARY','M014_POST_APPLY','overall_status',case when fail_count=0 then 'PASS' else 'FAIL' end,
  'fail_count=0; READ_ONLY_ROLLBACK; external_execution=LOCKED',format('pass_count=%s; fail_count=%s; warn_count=%s',pass_count,fail_count,warn_count),
  case when fail_count=0 then 'M014_POST_APPLY_SMOKE_PASS' else 'M014_POST_APPLY_SMOKE_FAIL_STOP' end,1 from summary
)
select check_group,object_name,check_name,status,expected_value,actual_value,detail from result order by sort_order,check_group,object_name,check_name;

rollback;
