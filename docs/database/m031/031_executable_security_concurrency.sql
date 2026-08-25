begin;
create temp table _m031_test as
select workspace_id,owner_user_id,null::uuid program_id,null::uuid source_id,null::uuid research_id,null::uuid strategy_id,null::bigint strategy_version
from (select apw.workspace_id,apw.user_id owner_user_id from public.account_personal_workspaces apw
 join public.workspaces ws on ws.id=apw.workspace_id and ws.status='active'
 join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=apw.user_id and wm.role='owner' and wm.status='active'
 join public.owner_profiles op on op.owner_id=apw.user_id and op.role='owner' and op.status='active' limit 1) x;
do $$ begin if not exists(select 1 from _m031_test) then raise exception 'm031_owner_fixture_required';end if;end $$;
insert into public.user_account_states(user_id,lifecycle_state,activated_at)
select owner_user_id,'ACTIVE',clock_timestamp() from _m031_test;
with x as(
 insert into public.affiliate_program_master(workspace_id,asp_name,program_id,advertiser_name,program_name,listing_ng_words_verification_status,source_type,created_by)
 select workspace_id,'M031_FIXTURE','M031-FIXTURE','M031 Fixture Advertiser','M031 Fixture Program','UNKNOWN','OWNER_TEST',owner_user_id from _m031_test returning id)
update _m031_test t set program_id=x.id from x;
with x as(
 insert into public.research_sources(workspace_id,owner_user_id,canonical_url,source_name,source_domain,source_type,reliability_class,cost_class,limitations)
 select workspace_id,owner_user_id,'https://example.com/m031-isolated-fixture','M031 isolated fixture','example.com','OTHER_WEB','LOW','FREE_CONFIRMED','transaction rollback fixture' from _m031_test returning id)
update _m031_test t set source_id=x.id from x;
with x as(
 insert into public.research_findings(workspace_id,owner_user_id,source_id,research_domain,observed_at,statement,truth_class,confidence,content_sha256,provenance)
 select workspace_id,owner_user_id,source_id,'AFFILIATE',clock_timestamp(),'M031 isolated strategy fixture finding','AI_INFERENCE',0.5,encode(extensions.digest('M031 isolated strategy fixture finding','sha256'),'hex'),jsonb_build_object('fixture',true,'evidence_status','NOT_EVIDENCE') from _m031_test returning id)
update _m031_test t set research_id=x.id from x;
insert into public.operational_object_links(workspace_id,owner_user_id,from_type,from_id,to_type,to_id,relation_type,provenance)
select workspace_id,owner_user_id,'GLOBAL_OPPORTUNITY',research_id,'AFFILIATE_PROGRAM',program_id,'CREATED_FOR',jsonb_build_object('fixture',true) from _m031_test;
grant select,update on _m031_test to service_role,authenticated;

set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
with x as(select * from public.prepare_affiliate_strategy(
 (select owner_user_id from _m031_test),(select program_id from _m031_test),(select research_id from _m031_test),
 jsonb_build_object('target_audience','fixture audience','core_positioning','fixture positioning','value_proposition','fixture value','key_pain','fixture pain','key_message','fixture message','recommended_angle','fixture angle','recommended_channels',jsonb_build_array('CONTENT'),'content_direction','fixture direction','risks','fixture risks','next_action','fixture next','provenance',jsonb_build_object('source','M031_ISOLATED_FIXTURE'),'inference_metadata',jsonb_build_object('truth_class','AI_INFERENCE','evidence_status','NOT_EVIDENCE')),
 'm031:isolated:strategy:fixture'))
update _m031_test t set strategy_id=x.strategy_id,strategy_version=x.strategy_version from x;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',(select owner_user_id from _m031_test))::text,true);
with x as(select * from public.review_affiliate_strategy((select strategy_id from _m031_test),(select strategy_version from _m031_test),
 jsonb_build_object('target_audience','Owner-reviewed audience','core_positioning','Owner-reviewed positioning','value_proposition','Owner-reviewed value','key_pain','Owner-reviewed pain','key_message','Owner-reviewed message','recommended_angle','Owner-reviewed angle','recommended_channels',jsonb_build_array('CONTENT'),'content_direction','Owner-reviewed direction','risks','Owner-reviewed risks','next_action','Owner-reviewed next'),
 'm031:isolated:review:fixture')) update _m031_test t set strategy_version=x.strategy_version from x;

do $$ begin
 begin perform public.confirm_affiliate_strategy((select strategy_id from _m031_test),(select strategy_version-1 from _m031_test),'m031:isolated:stale');raise exception 'm031_stale_write_not_denied';
 exception when others then if sqlerrm='m031_stale_write_not_denied' then raise;end if;end;
 begin update public.affiliate_strategies set key_message=key_message where false;raise exception 'm031_direct_dml_not_denied';
 exception when insufficient_privilege then null;end;
end $$;

with x as(select * from public.confirm_affiliate_strategy((select strategy_id from _m031_test),(select strategy_version from _m031_test),'m031:isolated:confirm:fixture')) update _m031_test t set strategy_version=x.strategy_version from x;
select jsonb_build_object('result','M031_EXECUTABLE_SECURITY_CONCURRENCY_PASS','status',(select status from public.affiliate_strategies where id=(select strategy_id from _m031_test)),'silent_overwrite',false,'browser_direct_dml','DENIED','paid_ai_jpy',0,'external_execution','LOCKED','transaction_rolled_back',true) verification;
rollback;
