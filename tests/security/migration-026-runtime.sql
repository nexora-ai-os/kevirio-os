begin;
select plan(1);
insert into auth.users(id) values ('16000000-0000-0000-0000-000000000001'),('16000000-0000-0000-0000-000000000002'),('16000000-0000-0000-0000-000000000003');
insert into public.workspaces(id,owner_id,slug,name,status) values
 ('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','m026-owner-a','M026 Owner A','active'),
 ('26000000-0000-0000-0000-000000000002','16000000-0000-0000-0000-000000000003','m026-owner-b','M026 Owner B','active');
insert into public.workspace_members(workspace_id,user_id,role,status) values
 ('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','owner','active'),
 ('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000002','member','active'),
 ('26000000-0000-0000-0000-000000000002','16000000-0000-0000-0000-000000000003','owner','active');
insert into public.owner_profiles(owner_id,role,status) values ('16000000-0000-0000-0000-000000000001','owner','active'),('16000000-0000-0000-0000-000000000003','owner','active');
insert into public.user_account_states(user_id,lifecycle_state,activated_at) values ('16000000-0000-0000-0000-000000000001','ACTIVE',now()),('16000000-0000-0000-0000-000000000002','ACTIVE',now()),('16000000-0000-0000-0000-000000000003','ACTIVE',now());
insert into public.account_personal_workspaces(user_id,workspace_id) values ('16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001'),('16000000-0000-0000-0000-000000000003','26000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"16000000-0000-0000-0000-000000000001"}',true);
select public.register_affiliate_program_master('TEST_ASP','M026-CRUD','Test Advertiser','Test Program',null,'rollback fixture');
do $$ declare v_id uuid; v_before timestamptz; begin
 select id,updated_at into v_id,v_before from public.affiliate_program_master where workspace_id='26000000-0000-0000-0000-000000000001' and program_id='M026-CRUD';
 perform public.update_affiliate_program_master(v_id,v_before,'{"program_name":"Edited Program","program_status":"PAUSED"}'::jsonb);
 if not exists(select 1 from public.affiliate_program_master where id=v_id and program_name='Edited Program' and program_status='PAUSED') then raise exception 'owner_update_failed'; end if;
 begin perform public.update_affiliate_program_master(v_id,v_before,'{"program_name":"Stale Write"}'::jsonb); raise exception 'stale_update_was_allowed';
 exception when raise_exception then if sqlerrm='stale_update_was_allowed' then raise; elsif sqlerrm<>'affiliate_program_stale_update' then raise; end if; end;
 select updated_at into v_before from public.affiliate_program_master where id=v_id;
 perform public.update_affiliate_program_master(v_id,v_before,'{"program_status":"ARCHIVED"}'::jsonb);
end $$;

reset role;
do $$ begin
 if not exists(select 1 from public.company_operating_events where event_type='affiliate_program_paused' and safe_metadata->>'external_execution'='LOCKED') then raise exception 'pause_audit_failed'; end if;
 if not exists(select 1 from public.company_operating_events where event_type='affiliate_program_archived' and safe_metadata->>'external_execution'='LOCKED') then raise exception 'archive_audit_failed'; end if;
end $$;
set local role authenticated;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"16000000-0000-0000-0000-000000000002"}',true);
do $$ declare v_id uuid; v_updated timestamptz; begin
 select id,updated_at into v_id,v_updated from public.affiliate_program_master where program_id='M026-CRUD';
 if v_id is not null then raise exception 'member_read_leak'; end if;
 begin perform public.update_affiliate_program_master('00000000-0000-0000-0000-000000000000',now(),'{"program_status":"PAUSED"}'::jsonb); raise exception 'member_update_was_allowed';
 exception when raise_exception then if sqlerrm='member_update_was_allowed' then raise; elsif sqlerrm<>'canonical_personal_workspace_owner_required' then raise; end if; end;
end $$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"16000000-0000-0000-0000-000000000003"}',true);
do $$ begin
 if exists(select 1 from public.affiliate_program_master where program_id='M026-CRUD') then raise exception 'cross_user_read_leak'; end if;
 begin perform public.update_affiliate_program_master((select id from public.affiliate_program_master where program_id='M026-CRUD'),now(),'{"program_status":"PAUSED"}'::jsonb); raise exception 'cross_workspace_update_was_allowed';
 exception when raise_exception then if sqlerrm='cross_workspace_update_was_allowed' then raise; end if; end;
end $$;
reset role;
select pass('M026 Owner CRUD, optimistic concurrency, denial, audit, and rollback transaction passed');
rollback;
