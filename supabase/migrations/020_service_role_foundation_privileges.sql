begin;

-- Server-only authorization and member inspection need read access to the
-- foundational identity/membership edges. Creation is encapsulated by the
-- protected bootstrap in migration 021, so no direct write privilege is needed.
revoke all on table public.owner_profiles, public.workspaces, public.workspace_members
  from anon, authenticated;

grant select on table public.owner_profiles, public.workspace_members to service_role;

commit;
