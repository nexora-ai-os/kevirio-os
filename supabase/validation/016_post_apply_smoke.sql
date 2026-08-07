-- Candidate SHA-256: FEBB0D695FEF8E2FBCFFECC0B0DD7B18114C87950EA3F6976422DDC6C868DE84
begin transaction read only;
do $$
declare pass_count int:=0;fail_count int:=0;warn_count int:=0;n int;
begin
 select count(*) into n from (values('organizations'),('organization_workspaces'),('businesses'),('teams'),('team_memberships'))v(name) where to_regclass('public.'||name) is not null;
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if not exists(select 1 from (values
 ('organizations','workspace_id'),('organizations','owner_id'),('organizations','external_execution_allowed'),('organizations','created_at'),('organizations','updated_at'),
 ('organization_workspaces','organization_id'),('organization_workspaces','workspace_id'),('organization_workspaces','external_execution_allowed'),
 ('businesses','organization_id'),('businesses','workspace_id'),('businesses','business_type'),('businesses','lifecycle_state'),('businesses','external_execution_allowed'),
 ('teams','organization_id'),('teams','business_id'),('teams','membership_status'),('teams','lifecycle_state'),('teams','external_execution_allowed'),
 ('team_memberships','team_id'),('team_memberships','workspace_id'),('team_memberships','user_id'),('team_memberships','external_execution_allowed')
 )r(t,c) where not exists(select 1 from information_schema.columns x where x.table_schema='public' and x.table_name=r.t and x.column_name=r.c)) then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_constraint where conname=any(array['organizations_id_workspace_unique','organizations_workspace_slug_unique','organizations_workspace_idempotency_unique','organization_workspaces_pk','organization_workspaces_organization_fk','businesses_id_workspace_unique','businesses_workspace_idempotency_unique','businesses_organization_workspace_fk','teams_id_workspace_unique','teams_workspace_idempotency_unique','teams_organization_workspace_fk','teams_business_workspace_fk','team_memberships_team_user_unique','team_memberships_team_workspace_fk','team_memberships_workspace_member_fk']);
 if n=15 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if exists(select 1 from pg_constraint where conrelid='public.businesses'::regclass and contype='c' and pg_get_constraintdef(oid) like '%affiliate%' and pg_get_constraintdef(oid) like '%custom%') and exists(select 1 from pg_constraint where conrelid='public.teams'::regclass and contype='c' and pg_get_constraintdef(oid) like '%archived%') then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relname=any(array['organizations_workspace_status_idx','organization_workspaces_workspace_idx','businesses_workspace_org_status_idx','teams_workspace_business_status_idx','team_memberships_workspace_user_idx']);
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relname=any(array['organizations','organization_workspaces','businesses','teams','team_memberships']) and c.relrowsecurity;
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname=any(array['organizations','organization_workspaces','businesses','teams','team_memberships']) and p.polname='v3_company_core_owner_read' and p.polcmd='r' and pg_get_expr(p.polqual,p.polrelid) like '%workspace_members%' and pg_get_expr(p.polqual,p.polrelid) like '%owner_profiles%';
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if not exists(select 1 from information_schema.role_table_grants where table_schema='public' and table_name=any(array['organizations','organization_workspaces','businesses','teams','team_memberships']) and grantee in('anon','authenticated') and privilege_type in('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')) and (select count(*) from information_schema.role_table_grants where table_schema='public' and table_name=any(array['organizations','organization_workspaces','businesses','teams','team_memberships']) and grantee='authenticated' and privilege_type='SELECT')=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname like 'register_v3_%' and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%';
 if n=3 and has_function_privilege('service_role','public.register_v3_organization(uuid,uuid,text,text,jsonb,text,text,text,text,text)','EXECUTE') and not has_function_privilege('authenticated','public.register_v3_organization(uuid,uuid,text,text,jsonb,text,text,text,text,text)','EXECUTE') then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if pg_get_functiondef('public.register_v3_organization(uuid,uuid,text,text,jsonb,text,text,text,text,text)'::regprocedure) like '%owner_profiles%' and pg_get_functiondef('public.register_v3_business(uuid,uuid,uuid,text,text,jsonb,text,text)'::regprocedure) like '%company_operating_events%' and pg_get_functiondef('public.register_v3_team(uuid,uuid,uuid,uuid,text,text[],text[],text,text)'::regprocedure) like '%workspace_members%' then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_trigger where not tgisinternal and tgname=any(array['organizations_touch_updated_at','organization_workspaces_touch_updated_at','businesses_touch_updated_at','teams_touch_updated_at','team_memberships_touch_updated_at']);
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_constraint where conrelid=any(array['public.organizations'::regclass,'public.organization_workspaces'::regclass,'public.businesses'::regclass,'public.teams'::regclass,'public.team_memberships'::regclass]) and contype='c' and pg_get_constraintdef(oid) like '%external_execution_allowed = false%';
 if n=5 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if (select count(*) from public.organizations)=0 and (select count(*) from public.businesses)=0 and (select count(*) from public.teams)=0 then pass_count:=pass_count+1;else warn_count:=warn_count+1;end if;
 pass_count:=pass_count+1;
 raise notice 'M016_POST_APPLY_SUMMARY overall_status=% pass_count=% fail_count=% warn_count=% candidate_sha256=FEBB0D695FEF8E2FBCFFECC0B0DD7B18114C87950EA3F6976422DDC6C868DE84 external_execution=LOCKED',case when fail_count=0 then 'PASS' else 'FAIL' end,pass_count,fail_count,warn_count;
 if fail_count>0 then raise exception 'M016_POST_APPLY_SMOKE_FAIL';end if;
 raise notice 'M016_POST_APPLY_SMOKE_PASS';
end $$;
rollback;
