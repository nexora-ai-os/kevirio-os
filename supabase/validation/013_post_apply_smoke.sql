begin transaction read only;

with
-- Expectations below are mechanically reconstructed from Migration 013 DDL.
expected_functions as (
  select * from (values
    ('public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)', true),
    ('public.enforce_v1_manual_package_contract()', false),
    ('public.touch_company_updated_at()', false),
    ('public.reject_company_event_mutation()', false)
  ) as expected(signature, expected_definer)
),
function_catalog as (
  select
    e.signature,
    e.expected_definer,
    p.oid,
    pg_get_userbyid(p.proowner) as owner_name,
    p.prosecdef,
    p.proconfig,
    coalesce((
      select btrim(substring(setting from position('=' in setting) + 1), E' \t\r\n"''')
      from unnest(coalesce(p.proconfig, '{}'::text[])) setting
      where split_part(setting, '=', 1) = 'search_path'
      limit 1
    ), '<missing>') as normalized_search_path,
    has_function_privilege('anon', p.oid, 'execute') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'execute') as service_role_execute
  from expected_functions e
  left join pg_proc p on p.oid = to_regprocedure(e.signature)
),
function_checks as (
  select 'functions'::text check_group, signature object_name, 'exists'::text check_name,
    case when oid is not null then 'PASS' else 'FAIL' end status,
    'function exists'::text expected, coalesce(oid::text, 'missing') actual,
    'Resolved with to_regprocedure exact signature.'::text detail
  from function_catalog
  union all
  select 'functions', signature, 'security_mode',
    case when oid is not null and prosecdef = expected_definer then 'PASS' else 'FAIL' end,
    case when expected_definer then 'SECURITY DEFINER' else 'SECURITY INVOKER' end,
    case when oid is null then 'missing' when prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end,
    'Compared with pg_proc.prosecdef.'
  from function_catalog
  union all
  select 'functions', signature, 'search_path',
    case when oid is not null and normalized_search_path = '' then 'PASS' else 'FAIL' end,
    'empty', normalized_search_path,
    'Quoted and whitespace-only empty representations are normalized.'
  from function_catalog
  union all
  select 'functions', signature, 'owner',
    case when oid is null then 'FAIL' else 'WARN' end,
    'Migration executor (not repository-provable)', coalesce(owner_name, 'missing'),
    'Owner is reported; no unsafe current_user equality assumption is made.'
  from function_catalog
  union all
  select 'functions', signature, 'execute_privileges',
    case
      when oid is null then 'FAIL'
      when signature like 'public.register_revenue_engine(%'
        and not coalesce(anon_execute, false)
        and not coalesce(authenticated_execute, false)
        and coalesce(service_role_execute, false) then 'PASS'
      when signature not like 'public.register_revenue_engine(%'
        and not coalesce(anon_execute, false)
        and not coalesce(authenticated_execute, false) then 'PASS'
      else 'FAIL'
    end,
    case when signature like 'public.register_revenue_engine(%'
      then 'anon=false, authenticated=false, service_role=true'
      else 'anon=false, authenticated=false' end,
    format('anon=%s, authenticated=%s, service_role=%s', anon_execute, authenticated_execute, service_role_execute),
    'Trigger helpers require no browser EXECUTE privilege.'
  from function_catalog
),
expected_tables as (
  select * from (values
    ('revenue_engine_definitions', 'revenue_engine_definitions_read'),
    ('market_profiles', 'company_owner_read'),
    ('revenue_engines', 'company_owner_read'),
    ('company_cycle_runs', 'company_owner_read'),
    ('content_assets', 'company_owner_read'),
    ('revenue_learning_records', 'company_owner_read'),
    ('executive_decisions', 'company_owner_read'),
    ('company_operating_events', 'company_owner_read')
  ) as expected(table_name, policy_name)
),
table_catalog as (
  select e.table_name, e.policy_name, c.oid, c.relrowsecurity
  from expected_tables e
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relnamespace = n.oid and c.relname = e.table_name and c.relkind in ('r','p')
),
authenticated_role as (
  select oid from pg_roles where rolname = 'authenticated'
),
policy_catalog as (
  select
    t.table_name,
    t.policy_name,
    p.oid as policy_oid,
    p.polpermissive,
    p.polcmd,
    p.polroles,
    regexp_replace(
      lower(coalesce(pg_get_expr(p.polqual, p.polrelid), '')),
      '[[:space:]"()]|::text|public\.', '', 'g'
    ) as normalized_qual
  from table_catalog t
  left join pg_policy p on p.polrelid = t.oid and p.polname = t.policy_name
),
table_policy_checks as (
  select 'rls'::text, table_name, 'table_exists',
    case when oid is not null then 'PASS' else 'FAIL' end,
    'public table exists', coalesce(oid::text, 'missing'), 'Resolved through pg_class and pg_namespace.'
  from table_catalog
  union all
  select 'rls', table_name, 'rls_enabled',
    case when oid is not null and relrowsecurity then 'PASS' else 'FAIL' end,
    'true', coalesce(relrowsecurity::text, 'missing'), 'Compared with pg_class.relrowsecurity.'
  from table_catalog
  union all
  select 'policies', table_name, 'policy_contract',
    case
      when policy_oid is null then 'FAIL'
      when not polpermissive or polcmd <> 'r' then 'FAIL'
      when not ((select oid from authenticated_role) = any(polroles)) then 'FAIL'
      when policy_name = 'revenue_engine_definitions_read' and normalized_qual = 'true' then 'PASS'
      when policy_name = 'company_owner_read'
        and normalized_qual like '%exists%workspace_members%'
        and normalized_qual like '%wm.workspace_id=' || table_name || '.workspace_id%'
        and normalized_qual like '%wm.user_id=auth.uid%'
        and normalized_qual like '%wm.role=''owner''%'
        and normalized_qual like '%wm.status=''active''%' then 'PASS'
      else 'FAIL'
    end,
    case when policy_name = 'revenue_engine_definitions_read'
      then 'PERMISSIVE authenticated SELECT USING true'
      else 'PERMISSIVE authenticated SELECT with active Owner workspace membership' end,
    format('oid=%s, permissive=%s, cmd=%s, roles=%s, qual=%s', policy_oid, polpermissive, polcmd, polroles, normalized_qual),
    'Policy identity and role/command use pg_policy; predicate is normalized before semantic checks.'
  from policy_catalog
  union all
  select 'privileges', table_name, 'browser_table_privileges',
    case when oid is not null
      and not coalesce(has_table_privilege('anon', oid, 'select'), false)
      and coalesce(has_table_privilege('authenticated', oid, 'select'), false)
      and not coalesce(has_table_privilege('authenticated', oid, 'insert'), false)
      and not coalesce(has_table_privilege('authenticated', oid, 'update'), false)
      and not coalesce(has_table_privilege('authenticated', oid, 'delete'), false)
      then 'PASS' else 'FAIL' end,
    'anon SELECT=false; authenticated SELECT=true; INSERT/UPDATE/DELETE=false',
    format('anon_select=%s, auth_select=%s, auth_insert=%s, auth_update=%s, auth_delete=%s',
      has_table_privilege('anon', oid, 'select'), has_table_privilege('authenticated', oid, 'select'),
      has_table_privilege('authenticated', oid, 'insert'), has_table_privilege('authenticated', oid, 'update'),
      has_table_privilege('authenticated', oid, 'delete')),
    'Privileges are evaluated independently of policy text.'
  from table_catalog
),
expected_triggers as (
  select * from (values
    ('execution_packages', 'execution_packages_v1_contract', 'public.enforce_v1_manual_package_contract()', 23),
    ('revenue_engine_definitions', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('market_profiles', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('revenue_engines', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('company_cycle_runs', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('content_assets', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('revenue_learning_records', 'company_touch_updated_at', 'public.touch_company_updated_at()', 19),
    ('company_operating_events', 'company_operating_events_immutable', 'public.reject_company_event_mutation()', 27)
  ) as expected(table_name, trigger_name, function_signature, expected_tgtype)
),
trigger_catalog as (
  select e.*, t.oid as trigger_oid, t.tgfoid, t.tgenabled, t.tgisinternal, t.tgtype::integer
  from expected_triggers e
  left join pg_class c on c.oid = to_regclass(format('public.%I', e.table_name))
  left join pg_trigger t on t.tgrelid = c.oid and t.tgname = e.trigger_name and not t.tgisinternal
),
trigger_checks as (
  select 'triggers'::text, table_name || '.' || trigger_name, 'structural_contract',
    case when trigger_oid is not null
      and tgfoid = to_regprocedure(function_signature)
      and tgenabled <> 'D'
      and not tgisinternal
      and tgtype = expected_tgtype then 'PASS' else 'FAIL' end,
    format('function=%s, enabled, non-internal, tgtype=%s', function_signature, expected_tgtype),
    format('oid=%s, function_oid=%s, enabled=%s, internal=%s, tgtype=%s', trigger_oid, tgfoid, tgenabled, tgisinternal, tgtype),
    'Timing, events and row level are verified with pg_trigger.tgtype bits.'
  from trigger_catalog
),
expected_fks as (
  select * from (values
    ('market_profiles','workspaces',array['workspace_id'],array['id']),
    ('revenue_engines','workspaces',array['workspace_id'],array['id']),
    ('revenue_engines','brand_profiles',array['brand_id','workspace_id'],array['id','workspace_id']),
    ('revenue_engines','market_profiles',array['market_id','workspace_id'],array['id','workspace_id']),
    ('company_cycle_runs','workspaces',array['workspace_id'],array['id']),
    ('company_cycle_runs','revenue_engines',array['revenue_engine_id','workspace_id'],array['id','workspace_id']),
    ('company_cycle_runs','offer_operations',array['operation_id','workspace_id'],array['id','workspace_id']),
    ('content_assets','workspaces',array['workspace_id'],array['id']),
    ('content_assets','revenue_engines',array['revenue_engine_id','workspace_id'],array['id','workspace_id']),
    ('content_assets','company_cycle_runs',array['cycle_run_id','workspace_id'],array['id','workspace_id']),
    ('content_assets','market_profiles',array['market_id','workspace_id'],array['id','workspace_id']),
    ('content_assets','approval_requests',array['approval_id','workspace_id'],array['id','workspace_id']),
    ('revenue_learning_records','workspaces',array['workspace_id'],array['id']),
    ('revenue_learning_records','revenue_engines',array['revenue_engine_id','workspace_id'],array['id','workspace_id']),
    ('executive_decisions','workspaces',array['workspace_id'],array['id']),
    ('executive_decisions','revenue_engines',array['revenue_engine_id','workspace_id'],array['id','workspace_id']),
    ('executive_decisions','approval_requests',array['required_approval_id','workspace_id'],array['id','workspace_id'])
  ) as expected(table_name, referenced_table, local_columns, referenced_columns)
),
fk_catalog as (
  select e.*,
    c.oid as constraint_oid,
    c.convalidated,
    array(select a.attname::text from unnest(c.conkey) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum order by k.ord) as actual_local_columns,
    array(select a.attname::text from unnest(c.confkey) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum order by k.ord) as actual_referenced_columns
  from expected_fks e
  left join pg_constraint c on c.contype = 'f'
    and c.conrelid = to_regclass(format('public.%I', e.table_name))
    and c.confrelid = to_regclass(format('public.%I', e.referenced_table))
    and array(select a.attname::text from unnest(c.conkey) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum order by k.ord) = e.local_columns
),
fk_checks as (
  select 'foreign_keys'::text, table_name || '->' || referenced_table, 'structural_contract',
    case when constraint_oid is not null and convalidated
      and actual_local_columns = local_columns and actual_referenced_columns = referenced_columns
      then 'PASS' else 'FAIL' end,
    format('%s -> %s', local_columns, referenced_columns),
    format('oid=%s, validated=%s, local=%s, referenced=%s', constraint_oid, convalidated, actual_local_columns, actual_referenced_columns),
    'Compared with pg_constraint keys and pg_attribute column order.'
  from fk_catalog
),
expected_indexes as (
  select * from (values
    ('revenue_engines','revenue_engines_workspace_status_type_idx',array['workspace_id','status','type']),
    ('company_cycle_runs','company_cycle_runs_workspace_status_stage_idx',array['workspace_id','status','current_stage']),
    ('content_assets','content_assets_workspace_status_type_idx',array['workspace_id','status','asset_type']),
    ('revenue_learning_records','revenue_learning_workspace_status_expiry_idx',array['workspace_id','status','expires_at']),
    ('executive_decisions','executive_decisions_workspace_status_deadline_idx',array['workspace_id','status','deadline']),
    ('company_operating_events','company_events_workspace_entity_created_idx',array['workspace_id','entity_type','entity_id','created_at'])
  ) as expected(table_name, index_name, key_columns)
),
index_catalog as (
  select e.*, ic.oid as index_oid, i.indisvalid, i.indisready, i.indisunique, am.amname,
    array(select a.attname::text from unnest(i.indkey::smallint[]) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum order by k.ord) as actual_key_columns
  from expected_indexes e
  left join pg_class tc on tc.oid = to_regclass(format('public.%I', e.table_name))
  left join pg_class ic on ic.relname = e.index_name and ic.relnamespace = tc.relnamespace
  left join pg_index i on i.indexrelid = ic.oid and i.indrelid = tc.oid
  left join pg_am am on am.oid = ic.relam
),
index_checks as (
  select 'indexes'::text, table_name || '.' || index_name, 'structural_contract',
    case when index_oid is not null and indisvalid and indisready and not indisunique
      and amname = 'btree' and actual_key_columns = key_columns then 'PASS' else 'FAIL' end,
    format('btree, valid, ready, non-unique, keys=%s', key_columns),
    format('oid=%s, valid=%s, ready=%s, unique=%s, method=%s, keys=%s', index_oid, indisvalid, indisready, indisunique, amname, actual_key_columns),
    'Compared with pg_index, pg_class, pg_am and pg_attribute.'
  from index_catalog
),
data_checks as (
  select 'seed_data'::text, 'revenue_engine_definitions', 'six_locked_definitions',
    case when count(*) = 6 then 'PASS' else 'FAIL' end,
    '6 definitions with external_execution_allowed=false', count(*)::text,
    'Counts the six canonical engine types with a strict false boundary.'
  from public.revenue_engine_definitions
  where engine_type in ('affiliate','media_advertising','sns_operations','owned_media','digital_products','service_client')
    and external_execution_allowed is false
  union all
  select 'locked_boundaries', 'revenue_engine_definitions', 'external_execution_locked',
    case when count(*) = 0 then 'PASS' else 'FAIL' end, '0 unsafe or NULL rows', count(*)::text,
    'NULL is unsafe and counted with IS DISTINCT FROM false.'
  from public.revenue_engine_definitions where external_execution_allowed is null or external_execution_allowed <> false
  union all
  select 'locked_boundaries', 'revenue_engines', 'external_execution_locked',
    case when count(*) = 0 then 'PASS' else 'FAIL' end, '0 unsafe or NULL rows', count(*)::text,
    'NULL is unsafe and counted with IS DISTINCT FROM false.'
  from public.revenue_engines where external_execution_allowed is null or external_execution_allowed <> false
  union all
  select 'locked_boundaries', 'content_assets', 'external_and_raw_content_locked',
    case when count(*) = 0 then 'PASS' else 'FAIL' end, '0 unsafe or NULL rows', count(*)::text,
    'Both flags must be explicitly false.'
  from public.content_assets
  where external_execution_allowed is null or external_execution_allowed <> false
    or raw_content_stored is null or raw_content_stored <> false
  union all
  select 'locked_boundaries', 'revenue_learning_records', 'raw_content_locked',
    case when count(*) = 0 then 'PASS' else 'FAIL' end, '0 unsafe or NULL rows', count(*)::text,
    'raw_content_stored must be explicitly false.'
  from public.revenue_learning_records where raw_content_stored is null or raw_content_stored <> false
),
all_checks as (
  select * from function_checks
  union all select * from table_policy_checks
  union all select * from trigger_checks
  union all select * from fk_checks
  union all select * from index_checks
  union all select * from data_checks
),
summary as (
  select
    count(*) filter (where status = 'PASS')::integer pass_count,
    count(*) filter (where status = 'FAIL')::integer fail_count,
    count(*) filter (where status = 'WARN')::integer warn_count
  from all_checks
),
final_rows as (
  select
    check_group, object_name, check_name, status, expected, actual, detail,
    null::text overall_status, null::integer pass_count, null::integer fail_count,
    null::integer warn_count, null::text execution_mode, null::text external_execution,
    0 sort_order
  from all_checks
  union all
  select
    'summary', 'migration_013', 'overall',
    case when fail_count = 0 then 'PASS' else 'FAIL' end,
    'all checks evaluated; fail_count=0',
    format('pass=%s, fail=%s, warn=%s', pass_count, fail_count, warn_count),
    'Warnings do not fail the smoke; every failed check is returned.',
    case when fail_count = 0 then 'M013_POST_APPLY_SMOKE_PASS' else 'M013_POST_APPLY_SMOKE_FAIL' end,
    pass_count, fail_count, warn_count, 'READ_ONLY_ROLLBACK', 'LOCKED', 1
  from summary
)
select
  check_group, object_name, check_name, status, expected, actual, detail,
  overall_status, pass_count, fail_count, warn_count, execution_mode, external_execution
from final_rows
order by sort_order, check_group, object_name, check_name;

rollback;
