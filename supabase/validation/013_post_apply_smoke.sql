begin;
set transaction read only;

-- Exact SECURITY DEFINER and empty search_path validation, kept separate for clear failures.
do $$
declare function_oid oid; is_definer boolean; search_path_is_empty boolean;
begin
  function_oid:=to_regprocedure('public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)');
  if function_oid is null then raise exception 'M013_SMOKE_RPC_MISSING:register_revenue_engine'; end if;
  select p.prosecdef,
    coalesce((select split_part(setting,'=',2)='' from unnest(coalesce(p.proconfig,array[]::text[])) setting where setting like 'search_path=%' limit 1),false)
  into is_definer,search_path_is_empty from pg_proc p where p.oid=function_oid;
  if not is_definer then raise exception 'M013_SMOKE_RPC_NOT_SECURITY_DEFINER'; end if;
  if not search_path_is_empty then raise exception 'M013_SMOKE_RPC_SEARCH_PATH_UNSAFE'; end if;
  if exists(
    select 1 from unnest(array[
      'public.touch_company_updated_at()','public.reject_company_event_mutation()',
      'public.enforce_v1_manual_package_contract()'
    ]) signature
    where to_regprocedure(signature) is null
      or not coalesce((
        select split_part(setting,'=',2)=''
        from pg_proc p, unnest(coalesce(p.proconfig,array[]::text[])) setting
        where p.oid=to_regprocedure(signature) and setting like 'search_path=%' limit 1
      ),false)
  ) then raise exception 'M013_SMOKE_HELPER_FUNCTION_UNSAFE_OR_MISSING'; end if;

  if has_function_privilege('anon','public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)','execute')
    or has_function_privilege('authenticated','public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)','execute') then
    raise exception 'M013_SMOKE_RPC_BROWSER_EXECUTE_UNSAFE';
  end if;
  if not has_function_privilege('service_role','public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)','execute') then
    raise exception 'M013_SMOKE_RPC_SERVICE_ROLE_EXECUTE_MISSING';
  end if;
end $$;

do $$
declare object_name text;
begin
  foreach object_name in array array[
    'revenue_engine_definitions','market_profiles','revenue_engines','company_cycle_runs',
    'content_assets','revenue_learning_records','executive_decisions','company_operating_events'
  ] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=object_name and c.relrowsecurity) then
      raise exception 'M013_SMOKE_RLS_DISABLED:%',object_name;
    end if;
    if object_name='revenue_engine_definitions' then
      if not exists(select 1 from pg_policies where schemaname='public' and tablename=object_name and policyname='revenue_engine_definitions_read' and cmd='SELECT' and permissive='PERMISSIVE' and roles=array['authenticated']::name[] and regexp_replace(qual,'\\s','','g')='true') then
        raise exception 'M013_SMOKE_POLICY_MISSING:%',object_name;
      end if;
    elsif not exists(
      select 1 from pg_policies
      where schemaname='public' and tablename=object_name and policyname='company_owner_read'
        and cmd='SELECT' and permissive='PERMISSIVE' and roles=array['authenticated']::name[]
        and regexp_replace(qual,'\\s','','g') like '%wm.workspace_id='||object_name||'.workspace_id%'
        and regexp_replace(qual,'\\s','','g') like '%wm.user_id=auth.uid()%'
        and regexp_replace(qual,'\\s','','g') like '%wm.role=''owner''%'
        and regexp_replace(qual,'\\s','','g') like '%wm.status=''active''%'
    ) then
      raise exception 'M013_SMOKE_POLICY_MISSING:%',object_name;
    end if;
    if has_table_privilege('anon',format('public.%I',object_name),'select')
      or has_table_privilege('authenticated',format('public.%I',object_name),'insert')
      or has_table_privilege('authenticated',format('public.%I',object_name),'update')
      or has_table_privilege('authenticated',format('public.%I',object_name),'delete') then
      raise exception 'M013_SMOKE_TABLE_PRIVILEGE_UNSAFE:%',object_name;
    end if;
  end loop;
end $$;

do $$
declare unsafe_count integer; seed_count integer;
begin
  select count(*) into seed_count from public.revenue_engine_definitions
  where engine_type in('affiliate','media_advertising','sns_operations','owned_media','digital_products','service_client')
    and external_execution_allowed=false;
  if seed_count<>6 then raise exception 'M013_SMOKE_ENGINE_DEFINITIONS_INVALID:%/6',seed_count; end if;

  select count(*) into unsafe_count from public.revenue_engine_definitions where external_execution_allowed<>false;
  select unsafe_count+count(*) into unsafe_count from public.revenue_engines where external_execution_allowed<>false;
  select unsafe_count+count(*) into unsafe_count from public.content_assets where external_execution_allowed<>false or raw_content_stored<>false;
  select unsafe_count+count(*) into unsafe_count from public.revenue_learning_records where raw_content_stored<>false;
  if unsafe_count<>0 then raise exception 'M013_SMOKE_LOCKED_BOUNDARY_VIOLATION:%',unsafe_count; end if;

  if not exists(select 1 from pg_trigger where tgrelid='public.execution_packages'::regclass and tgname='execution_packages_v1_contract' and not tgisinternal) then
    raise exception 'M013_SMOKE_MANUAL_PACKAGE_TRIGGER_MISSING';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.company_operating_events'::regclass and tgname='company_operating_events_immutable' and not tgisinternal) then
    raise exception 'M013_SMOKE_APPEND_ONLY_TRIGGER_MISSING';
  end if;
  if exists(
    select 1 from unnest(array['revenue_engine_definitions','market_profiles','revenue_engines','company_cycle_runs','content_assets','revenue_learning_records']) target(name)
    where not exists(
      select 1 from pg_trigger t
      where t.tgrelid=format('public.%I',target.name)::regclass and t.tgname='company_touch_updated_at'
        and not t.tgisinternal and t.tgenabled<>'D'
        and pg_get_triggerdef(t.oid,true) like 'CREATE TRIGGER company_touch_updated_at BEFORE UPDATE ON public.% EXECUTE FUNCTION touch_company_updated_at()'
    )
  ) then raise exception 'M013_SMOKE_UPDATED_AT_TRIGGER_DEFINITION_INVALID'; end if;
  if (select count(*) from pg_indexes where schemaname='public' and indexname in(
    'revenue_engines_workspace_status_type_idx','company_cycle_runs_workspace_status_stage_idx',
    'content_assets_workspace_status_type_idx','revenue_learning_workspace_status_expiry_idx',
    'executive_decisions_workspace_status_deadline_idx','company_events_workspace_entity_created_idx'
  ))<>6 then raise exception 'M013_SMOKE_INDEX_SET_INCOMPLETE'; end if;
end $$;

do $$
declare expected_fk record; expected_index record;
begin
  if not exists(
    select 1 from pg_constraint
    where conrelid='public.revenue_learning_records'::regclass and contype='f'
      and pg_get_constraintdef(oid,true)='FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES revenue_engines(id, workspace_id)'
  ) then raise exception 'M013_SMOKE_REVENUE_LEARNING_WORKSPACE_FK_INVALID'; end if;
  if not exists(
    select 1 from pg_trigger
    where tgrelid='public.company_operating_events'::regclass and tgname='company_operating_events_immutable'
      and not tgisinternal and tgenabled<>'D'
      and pg_get_triggerdef(oid,true)='CREATE TRIGGER company_operating_events_immutable BEFORE UPDATE OR DELETE ON public.company_operating_events FOR EACH ROW EXECUTE FUNCTION reject_company_event_mutation()'
  ) then raise exception 'M013_SMOKE_APPEND_ONLY_TRIGGER_DEFINITION_INVALID'; end if;
  if not exists(
    select 1 from pg_indexes where schemaname='public' and tablename='revenue_learning_records'
      and indexname='revenue_learning_workspace_status_expiry_idx'
      and indexdef like '%USING btree (workspace_id, status, expires_at)'
  ) then raise exception 'M013_SMOKE_REVENUE_LEARNING_INDEX_INVALID'; end if;
  for expected_fk in select * from (values
    ('revenue_engines','FOREIGN KEY (brand_id, workspace_id) REFERENCES brand_profiles(id, workspace_id)'),
    ('revenue_engines','FOREIGN KEY (market_id, workspace_id) REFERENCES market_profiles(id, workspace_id)'),
    ('company_cycle_runs','FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES revenue_engines(id, workspace_id)'),
    ('company_cycle_runs','FOREIGN KEY (operation_id, workspace_id) REFERENCES offer_operations(id, workspace_id)'),
    ('content_assets','FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES revenue_engines(id, workspace_id)'),
    ('content_assets','FOREIGN KEY (cycle_run_id, workspace_id) REFERENCES company_cycle_runs(id, workspace_id)'),
    ('content_assets','FOREIGN KEY (market_id, workspace_id) REFERENCES market_profiles(id, workspace_id)'),
    ('content_assets','FOREIGN KEY (approval_id, workspace_id) REFERENCES approval_requests(id, workspace_id)'),
    ('revenue_learning_records','FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES revenue_engines(id, workspace_id)'),
    ('executive_decisions','FOREIGN KEY (revenue_engine_id, workspace_id) REFERENCES revenue_engines(id, workspace_id)'),
    ('executive_decisions','FOREIGN KEY (required_approval_id, workspace_id) REFERENCES approval_requests(id, workspace_id)')
  ) as expected(table_name,definition) loop
    if not exists(
      select 1 from pg_constraint
      where conrelid=format('public.%I',expected_fk.table_name)::regclass and contype='f' and convalidated
        and replace(pg_get_constraintdef(oid,true),'public.','')=expected_fk.definition
    ) then raise exception 'M013_SMOKE_FK_DEFINITION_INVALID:%.%',expected_fk.table_name,expected_fk.definition; end if;
  end loop;
  for expected_index in select * from (values
    ('revenue_engines','revenue_engines_workspace_status_type_idx','(workspace_id, status, type)'),
    ('company_cycle_runs','company_cycle_runs_workspace_status_stage_idx','(workspace_id, status, current_stage)'),
    ('content_assets','content_assets_workspace_status_type_idx','(workspace_id, status, asset_type)'),
    ('revenue_learning_records','revenue_learning_workspace_status_expiry_idx','(workspace_id, status, expires_at)'),
    ('executive_decisions','executive_decisions_workspace_status_deadline_idx','(workspace_id, status, deadline)'),
    ('company_operating_events','company_events_workspace_entity_created_idx','(workspace_id, entity_type, entity_id, created_at)')
  ) as expected(table_name,index_name,columns) loop
    if not exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename=expected_index.table_name and indexname=expected_index.index_name
        and indexdef like '%USING btree '||expected_index.columns
    ) then raise exception 'M013_SMOKE_INDEX_DEFINITION_INVALID:%',expected_index.index_name; end if;
  end loop;
  if exists(
    select 1 from pg_proc p
    where p.oid in(
      to_regprocedure('public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)'),
      to_regprocedure('public.enforce_v1_manual_package_contract()'),
      to_regprocedure('public.touch_company_updated_at()'),
      to_regprocedure('public.reject_company_event_mutation()')
    ) and (pg_get_userbyid(p.proowner)<>current_user or not coalesce(array_to_string(p.proconfig,',') like '%search_path=%',false))
  ) then raise exception 'M013_SMOKE_FUNCTION_OWNER_OR_SEARCH_PATH_INVALID'; end if;
end $$;

select
  'M013_POST_APPLY_SMOKE_PASS'::text as result,
  8::integer as table_count,
  6::integer as revenue_engine_definition_count,
  'LOCKED'::text as external_execution,
  'READ_ONLY_ROLLBACK'::text as execution_mode;

rollback;
