\set ON_ERROR_STOP on
begin;

insert into auth.users(id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');
insert into public.workspaces(id,owner_id,slug,name,status) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','m025-owner-a','M025 Owner A','active'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','m025-owner-b','M025 Owner B','active');
insert into public.workspace_members(workspace_id,user_id,role,status) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','owner','active'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','member','active'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','owner','active');
insert into public.owner_profiles(owner_id,role,status) values
  ('10000000-0000-0000-0000-000000000001','owner','active'),
  ('10000000-0000-0000-0000-000000000003','owner','active');
insert into public.user_account_states(user_id,lifecycle_state,activated_at) values
  ('10000000-0000-0000-0000-000000000001','ACTIVE',now()),
  ('10000000-0000-0000-0000-000000000002','ACTIVE',now()),
  ('10000000-0000-0000-0000-000000000003','ACTIVE',now());
insert into public.account_personal_workspaces(user_id,workspace_id) values
  ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"10000000-0000-0000-0000-000000000001"}',true);
do $$ begin
  if not public.is_canonical_personal_workspace_owner('20000000-0000-0000-0000-000000000001') then raise exception 'owner_boundary_failed'; end if;
  if public.is_canonical_personal_workspace_owner('20000000-0000-0000-0000-000000000002') then raise exception 'cross_workspace_boundary_failed'; end if;
  perform count(*) from public.affiliate_programs where workspace_id='20000000-0000-0000-0000-000000000001';
  perform count(*) from public.affiliate_publications where workspace_id='20000000-0000-0000-0000-000000000001';
  perform count(*) from public.affiliate_performance_records where workspace_id='20000000-0000-0000-0000-000000000001';
  perform count(*) from public.revenue_records where workspace_id='20000000-0000-0000-0000-000000000001';
  perform count(*) from public.operating_cost_records where workspace_id='20000000-0000-0000-0000-000000000001';
end $$;
select public.register_affiliate_program_master('TEST_ASP','TEST-PROGRAM-1','TEST Advertiser','TEST Program',null,'isolated rollback fixture');
do $$ begin
  if (select count(*) from public.affiliate_program_master where workspace_id='20000000-0000-0000-0000-000000000001')<>1 then raise exception 'owner_rpc_readback_failed'; end if;
  begin
    insert into public.affiliate_program_master(workspace_id,asp_name,program_id,advertiser_name,program_name,created_by)
    values('20000000-0000-0000-0000-000000000001','DENIED','DENIED','DENIED','DENIED','10000000-0000-0000-0000-000000000001');
    raise exception 'direct_insert_was_allowed';
  exception when insufficient_privilege then null; end;
  begin update public.affiliate_program_master set program_name='DENIED' where workspace_id='20000000-0000-0000-0000-000000000001'; raise exception 'direct_update_was_allowed';
  exception when insufficient_privilege then null; end;
  begin delete from public.affiliate_program_master where workspace_id='20000000-0000-0000-0000-000000000001'; raise exception 'direct_delete_was_allowed';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"10000000-0000-0000-0000-000000000002"}',true);
do $$ begin
  if public.is_canonical_personal_workspace_owner('20000000-0000-0000-0000-000000000001') then raise exception 'member_boundary_failed'; end if;
  if (select count(*) from public.affiliate_program_master where workspace_id='20000000-0000-0000-0000-000000000001')<>0 then raise exception 'member_read_leak'; end if;
  begin perform public.register_affiliate_program_master('DENIED','DENIED','DENIED','DENIED'); raise exception 'member_rpc_was_allowed';
  exception when raise_exception then if sqlerrm='member_rpc_was_allowed' then raise; end if; end;
end $$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"10000000-0000-0000-0000-000000000003"}',true);
do $$ begin
  if (select count(*) from public.affiliate_program_master where workspace_id='20000000-0000-0000-0000-000000000001')<>0 then raise exception 'cross_user_read_leak'; end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
  begin perform count(*) from public.affiliate_program_master; raise exception 'anonymous_read_was_allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
