-- Candidate SHA-256: FEBB0D695FEF8E2FBCFFECC0B0DD7B18114C87950EA3F6976422DDC6C868DE84
begin transaction read only;
do $$
declare pass_count int:=0;fail_count int:=0;warn_count int:=0;n int;
begin
 if to_regclass('public.workspaces') is not null and to_regclass('public.workspace_members') is not null and to_regclass('public.owner_profiles') is not null then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 if to_regclass('public.company_operating_events') is not null and to_regclass('public.revenue_records') is not null and to_regclass('public.operating_cost_records') is not null and to_regclass('public.evidence_candidates') is not null and to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)') is not null then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relname=any(array['organizations','organization_workspaces','businesses','teams','team_memberships','organizations_workspace_status_idx','organization_workspaces_workspace_idx','businesses_workspace_org_status_idx','teams_workspace_business_status_idx','team_memberships_workspace_user_idx']);
 if n=0 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname=any(array['touch_v3_company_core_updated_at','register_v3_organization','register_v3_business','register_v3_team']);
 if n=0 then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 select count(*) into n from pg_trigger where not tgisinternal and tgname=any(array['organizations_touch_updated_at','organization_workspaces_touch_updated_at','businesses_touch_updated_at','teams_touch_updated_at','team_memberships_touch_updated_at']);
 if n=0 and not exists(select 1 from pg_policy where polname='v3_company_core_owner_read') then pass_count:=pass_count+1;else fail_count:=fail_count+1;end if;
 pass_count:=pass_count+1;
 raise notice 'M016_PRE_APPLY_SUMMARY overall_status=% pass_count=% fail_count=% warn_count=% candidate_sha256=FEBB0D695FEF8E2FBCFFECC0B0DD7B18114C87950EA3F6976422DDC6C868DE84 external_execution=LOCKED',case when fail_count=0 then 'PASS' else 'FAIL' end,pass_count,fail_count,warn_count;
 if fail_count>0 then raise exception 'M016_PRE_APPLY_FAIL';end if;
 raise notice 'M016_PRE_APPLY_PASS';
end $$;
rollback;
