-- Run only after accepted-data freeze/export verification and 029_rollback.sql.
begin isolation level serializable;
set local lock_timeout='8s'; set local statement_timeout='120s';
do $$ begin
 if to_regclass('public.canonical_domain_drafts') is not null then raise exception 'm029_must_be_rolled_back_before_pre_state_restore';end if;
 if (select count(*) from _m029_recovery.snapshot_control where state='SEALED')<>1 then raise exception 'm029_snapshot_not_sealed';end if;
end $$;
do $restore$ declare t text;r record;cols text; begin
 foreach t in array array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records'] loop
  select string_agg(format('%I = x.%I',column_name,column_name),',' order by ordinal_position) into cols from information_schema.columns where table_schema='public' and table_name=t and is_generated='NEVER';
  execute format('alter table public.%I disable trigger user',t);
  for r in select row_data from _m029_recovery.business_rows where source_table=t loop
   execute format('update public.%I p set %s from jsonb_populate_record(null::public.%I,$1) x where p.id=x.id',t,cols,t) using r.row_data;
   if not found then execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1)',t,t) using r.row_data;end if;
  end loop;
  execute format('alter table public.%I enable trigger user',t);
 end loop;
end $restore$;
do $security$ declare r record;j jsonb;cmd text;t text; begin
 for r in select definition from _m029_recovery.security_metadata where kind='FUNCTION' loop execute r.definition;end loop;
 for r in select definition from _m029_recovery.security_metadata where kind='POLICY' loop
  j:=r.definition::jsonb;
  execute format('drop policy if exists %I on %I.%I',j->>'policyname',j->>'schemaname',j->>'tablename');
  cmd:=format('create policy %I on %I.%I as %s for %s to %s',j->>'policyname',j->>'schemaname',j->>'tablename',j->>'permissive',j->>'cmd',array_to_string(array(select quote_ident(x) from jsonb_array_elements_text(j->'roles') x),','));
  if j->>'qual' is not null then cmd:=cmd||' using ('||(j->>'qual')||')';end if;
  if j->>'with_check' is not null then cmd:=cmd||' with check ('||(j->>'with_check')||')';end if;
  execute cmd;
 end loop;
 foreach t in array array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records'] loop execute format('revoke all on public.%I from anon,authenticated,service_role',t);end loop;
 for r in select definition from _m029_recovery.security_metadata where kind='GRANT' loop j:=r.definition::jsonb;execute format('grant %s on %I.%I to %I',j->>'privilege_type',j->>'table_schema',j->>'table_name',j->>'grantee');end loop;
 for r in select object_identity,definition from _m029_recovery.security_metadata where kind='TABLE_SECURITY' loop
  j:=r.definition::jsonb;
  execute format('alter table %s %s row level security',r.object_identity,case when (j->>'rls')::boolean then 'enable' else 'disable' end);
  execute format('alter table %s %s force row level security',r.object_identity,case when (j->>'force_rls')::boolean then '' else 'no' end);
 end loop;
end $security$;
commit;
select 'M029_PRE_APPLY_BUSINESS_AND_SECURITY_RESTORE_COMPLETE_VERIFY_NEXT' result;
