-- Executable isolated-runtime M028 adversarial suite. Never run in Production.
begin;
insert into auth.users(id) values ('28000000-0000-4000-8000-000000000001'),('28000000-0000-4000-8000-000000000002');
insert into public.workspaces(id,owner_id,slug,name,status) values
 ('28000000-0000-4000-8000-000000000101','28000000-0000-4000-8000-000000000001','m028-a','M028 A','active'),
 ('28000000-0000-4000-8000-000000000102','28000000-0000-4000-8000-000000000002','m028-b','M028 B','active');
insert into public.workspace_members(workspace_id,user_id,role,status) values
 ('28000000-0000-4000-8000-000000000101','28000000-0000-4000-8000-000000000001','owner','active'),
 ('28000000-0000-4000-8000-000000000102','28000000-0000-4000-8000-000000000002','owner','active'),
 ('28000000-0000-4000-8000-000000000102','28000000-0000-4000-8000-000000000001','owner','active');
insert into public.owner_profiles(owner_id,role,status) values ('28000000-0000-4000-8000-000000000001','owner','active'),('28000000-0000-4000-8000-000000000002','owner','active');
insert into public.user_account_states(user_id,lifecycle_state,activated_at) values ('28000000-0000-4000-8000-000000000001','ACTIVE',clock_timestamp()),('28000000-0000-4000-8000-000000000002','ACTIVE',clock_timestamp());
insert into public.account_personal_workspaces(user_id,workspace_id) values ('28000000-0000-4000-8000-000000000001','28000000-0000-4000-8000-000000000101'),('28000000-0000-4000-8000-000000000002','28000000-0000-4000-8000-000000000102');
create temporary table m028_ids(k text primary key,id uuid,version bigint);
grant select,insert,update on m028_ids to authenticated,service_role;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"28000000-0000-4000-8000-000000000001"}',true);
insert into m028_ids select 'a1',object_id,object_version from public.save_operational_object(null,'QUICK_CAPTURE','A private','', 'READY',null,null,'{}','OWNER_STATED',null);
insert into m028_ids select 'a2',object_id,object_version from public.save_operational_object(null,'RESEARCH_PACKAGE','A research','', 'READY',null,null,'{}','OWNER_STATED',null);
insert into m028_ids values('thread_a',public.create_ai_conversation_thread('A private thread',gen_random_uuid()),null);
do $$ declare v_msg uuid; begin select message_id into v_msg from public.append_ai_user_message((select id from m028_ids where k='thread_a'),'28000000-0000-4000-8000-000000000201','Owner memory source'); insert into m028_ids values('message_a',v_msg,null); end $$;
select public.save_operational_draft((select id from m028_ids where k='a1'),null,1,'{"text":"draft-a"}','PC');
insert into m028_ids values('link_a',public.link_operational_objects('QUICK_CAPTURE',(select id from m028_ids where k='a1'),'RESEARCH_PACKAGE',(select id from m028_ids where k='a2'),'RELATES_TO','{"source":"owner"}'),null);
insert into m028_ids values('action_a',public.prepare_internal_action('worker','QUICK_CAPTURE',(select id from m028_ids where k='a1'),'ANALYZE','L1_THINK','LOW','AUTO_LOW_RISK','{"idempotency_key":"action:test:0001"}'),null);
do $$ declare x uuid; begin
 x:=public.link_operational_objects('QUICK_CAPTURE',(select id from m028_ids where k='a1'),'RESEARCH_PACKAGE',(select id from m028_ids where k='a2'),'RELATES_TO','{"source":"retry"}');
 if x<>(select id from m028_ids where k='link_a') then raise exception 'duplicate_link_created'; end if;
 if (select count(*) from public.operational_activity_events where idempotency_key='link:'||x||':created')<>1 then raise exception 'duplicate_link_event'; end if;
 x:=public.prepare_internal_action('worker','QUICK_CAPTURE',(select id from m028_ids where k='a1'),'ANALYZE','L1_THINK','LOW','AUTO_LOW_RISK','{"idempotency_key":"action:test:0001"}');
 if x<>(select id from m028_ids where k='action_a') or (select count(*) from public.internal_action_records where id=x)<>1 then raise exception 'duplicate_action_created'; end if;
end $$;
do $$ declare v bigint; begin
 select object_version into v from public.save_operational_object((select id from m028_ids where k='a1'),'QUICK_CAPTURE','A v2','', 'READY',null,null,'{}','OWNER_STATED',1);
 if v<>2 then raise exception 'object_version_not_advanced'; end if;
 begin perform public.save_operational_object((select id from m028_ids where k='a1'),'QUICK_CAPTURE','stale','', 'READY',null,null,'{}','OWNER_STATED',1); raise exception 'stale_object_allowed'; exception when raise_exception then if sqlerrm='stale_object_allowed' then raise; elsif sqlerrm<>'operational_object_stale_or_not_found' then raise; end if; end;
 perform public.save_operational_draft((select id from m028_ids where k='a1'),1,2,'{"text":"draft-v2"}','iPhone');
 begin perform public.save_operational_draft((select id from m028_ids where k='a1'),1,2,'{"text":"stale"}','iPad'); raise exception 'stale_draft_allowed'; exception when raise_exception then if sqlerrm='stale_draft_allowed' then raise; elsif sqlerrm<>'operational_draft_stale_or_not_found' then raise; end if; end;
end $$;
do $$ begin
 begin insert into public.operational_objects(id) values(gen_random_uuid()); raise exception 'browser_insert_allowed'; exception when insufficient_privilege then null; end;
 begin update public.operational_activity_events set event_type='FORGED'; raise exception 'timeline_update_allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.operational_activity_events; raise exception 'timeline_delete_allowed'; exception when insufficient_privilege then null; end;
 begin perform public.register_research_source('28000000-0000-4000-8000-000000000001','https://example.com','x','example.com',null,null,'OTHER_WEB','LOW','FREE_CONFIRMED',null,'{}'); raise exception 'service_rpc_allowed'; exception when insufficient_privilege then null; end;
 begin perform public.link_operational_objects('QUICK_CAPTURE',gen_random_uuid(),'RESEARCH_PACKAGE',(select id from m028_ids where k='a2'),'RELATES_TO','{"source":"x"}'); raise exception 'missing_link_allowed'; exception when raise_exception then if sqlerrm='missing_link_allowed' then raise; end if; end;
 begin perform public.link_operational_objects('WRONG',(select id from m028_ids where k='a1'),'RESEARCH_PACKAGE',(select id from m028_ids where k='a2'),'RELATES_TO','{"source":"x"}'); raise exception 'wrong_type_allowed'; exception when raise_exception then if sqlerrm='wrong_type_allowed' then raise; end if; end;
 begin perform public.link_operational_objects('QUICK_CAPTURE',(select id from m028_ids where k='a1'),'QUICK_CAPTURE',(select id from m028_ids where k='a1'),'RELATES_TO','{"source":"x"}'); raise exception 'self_link_allowed'; exception when check_violation then null; end;
 begin perform public.save_operational_object(null,'QUICK_CAPTURE','secret-test','', 'READY',null,null,'{"client_secret":"hidden"}','OWNER_STATED',null); raise exception 'secret_allowed'; exception when raise_exception then if sqlerrm='secret_allowed' then raise; end if; end;
 begin perform public.prepare_internal_action('worker','QUICK_CAPTURE',(select id from m028_ids where k='a1'),'TEST','L3_EXECUTE','LOW','AUTO_LOW_RISK','{}'); raise exception 'l3_allowed'; exception when raise_exception then if sqlerrm='l3_allowed' then raise; end if; end;
end $$;

reset role; select set_config('request.jwt.claims','{"role":"service_role"}',true); set local role service_role;
insert into m028_ids values('source_a',public.register_research_source('28000000-0000-4000-8000-000000000001','https://example.com/a','Example','example.com','JP',null,'OTHER_WEB','LOW','FREE_CONFIRMED',null,'{}'),null);
insert into m028_ids values('finding_a',public.record_research_finding('28000000-0000-4000-8000-000000000001',(select id from m028_ids where k='source_a'),'OPPORTUNITY','Japan','JP','ja-JP',clock_timestamp(),clock_timestamp()+interval '1 day','A sourced finding','WEB_SOURCE',0.8,'{"source":"https://example.com/a"}',null),null);
insert into m028_ids values('memory_a',public.upsert_ai_memory('28000000-0000-4000-8000-000000000001',(select id from m028_ids where k='thread_a'),(select id from m028_ids where k='message_a'),'OWNER_FACT','Owner memory','owner-memory','{"source":"OWNER_INPUT"}',1,null),null);
do $$ begin
 begin perform public.register_research_source('28000000-0000-4000-8000-000000000001','https://paid.example','Paid','paid.example',null,null,'OTHER_WEB','LOW','PAID',null,'{}'); raise exception 'paid_source_allowed'; exception when raise_exception then if sqlerrm='paid_source_allowed' then raise; end if; end;
 begin perform public.register_research_source('28000000-0000-4000-8000-000000000001','https://unknown.example','Unknown','unknown.example',null,null,'OTHER_WEB','LOW','UNKNOWN',null,'{}'); raise exception 'unknown_source_allowed'; exception when raise_exception then if sqlerrm='unknown_source_allowed' then raise; end if; end;
end $$;

reset role; set local role authenticated; select set_config('request.jwt.claims','{"role":"authenticated","sub":"28000000-0000-4000-8000-000000000002"}',true);
insert into m028_ids select 'b1',object_id,object_version from public.save_operational_object(null,'QUICK_CAPTURE','B private','', 'READY',null,null,'{}','OWNER_STATED',null);
do $$ begin
 if exists(select 1 from public.operational_objects where id=(select id from m028_ids where k='a1')) then raise exception 'cross_user_object_leak'; end if;
 if exists(select 1 from public.operational_object_drafts where object_id=(select id from m028_ids where k='a1')) then raise exception 'cross_user_draft_leak'; end if;
 if exists(select 1 from public.operational_object_links where id=(select id from m028_ids where k='link_a')) then raise exception 'cross_user_link_leak'; end if;
 if exists(select 1 from public.operational_activity_events where owner_user_id='28000000-0000-4000-8000-000000000001') then raise exception 'cross_user_timeline_leak'; end if;
 if exists(select 1 from public.research_findings where id=(select id from m028_ids where k='finding_a')) then raise exception 'cross_user_research_leak'; end if;
 if exists(select 1 from public.ai_memory_records where id=(select id from m028_ids where k='memory_a')) then raise exception 'cross_user_memory_leak'; end if;
 begin perform public.link_operational_objects('QUICK_CAPTURE',(select id from m028_ids where k='b1'),'QUICK_CAPTURE',(select id from m028_ids where k='a1'),'RELATES_TO','{"source":"attack"}'); raise exception 'cross_workspace_link_allowed'; exception when raise_exception then if sqlerrm='cross_workspace_link_allowed' then raise; end if; end;
end $$;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"28000000-0000-4000-8000-000000000001"}',true);
do $$ begin if exists(select 1 from public.operational_objects where id=(select id from m028_ids where k='b1')) then raise exception 'admin_private_leak'; end if; end $$;
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
do $$ begin
 if exists(select 1 from information_schema.role_table_grants where table_schema='public' and table_name in('operational_objects','operational_object_drafts','operational_object_links','operational_activity_events','research_sources','research_findings','internal_action_records','provider_free_quota_states') and grantee in('anon','authenticated') and privilege_type in('INSERT','UPDATE','DELETE')) then raise exception 'browser_dml_grant_exposed'; end if;
 if exists(select 1 from public.internal_action_records where autonomy_level not in('L0_READ','L1_THINK','L2_PREPARE') or paid_cost_jpy<>0 or external_execution) then raise exception 'action_governance_broken'; end if;
end $$;
rollback;
