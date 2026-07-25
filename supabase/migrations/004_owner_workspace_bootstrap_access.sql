begin;

grant usage on schema public to authenticated;
grant select on table public.owner_profiles to authenticated;
grant select on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;
grant select on table public.brand_profiles to authenticated;

revoke all on function public.bootstrap_owner_workspace(text,text) from public;
revoke all on function public.bootstrap_owner_workspace(text,text) from anon;
grant execute on function public.bootstrap_owner_workspace(text,text) to authenticated;

commit;
