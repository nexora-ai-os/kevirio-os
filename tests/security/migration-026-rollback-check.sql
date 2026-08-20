do $$ begin
 if exists(select 1 from public.workspaces where id in('26000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000002')) then raise exception 'm026_workspace_fixture_remained'; end if;
 if exists(select 1 from public.affiliate_program_master where program_id='M026-CRUD') then raise exception 'm026_program_fixture_remained'; end if;
 if exists(select 1 from auth.users where id in('16000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000002','16000000-0000-0000-0000-000000000003')) then raise exception 'm026_auth_fixture_remained'; end if;
end $$;
