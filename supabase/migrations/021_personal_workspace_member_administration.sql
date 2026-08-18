begin;

create table public.account_personal_workspaces (
  user_id uuid primary key references auth.users(id) on delete restrict,
  workspace_id uuid not null unique references public.workspaces(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint account_personal_workspace_membership_fk foreign key(workspace_id,user_id)
    references public.workspace_members(workspace_id,user_id)
);

create table public.member_administration_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  target_user_id uuid not null references auth.users(id),
  workspace_id uuid references public.workspaces(id),
  action text not null check(action in ('INVITED','SUSPENDED','REACTIVATED','DEACTIVATED','ROLE_CHANGED','TEAM_RELATIONSHIP_CHANGED')),
  outcome text not null check(outcome in ('SUCCEEDED','DENIED','FAILED')),
  reason_code text not null check(reason_code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  created_at timestamptz not null default now(),
  check(actor_user_id<>target_user_id or action not in ('SUSPENDED','DEACTIVATED'))
);

alter table public.account_personal_workspaces enable row level security;
alter table public.member_administration_events enable row level security;

create policy account_personal_workspace_self_read on public.account_personal_workspaces
  for select to authenticated using(user_id=auth.uid());

revoke all on table public.account_personal_workspaces,public.member_administration_events from public,anon,authenticated;
grant select on table public.account_personal_workspaces to authenticated;
grant select,insert on table public.account_personal_workspaces to service_role;
grant select,insert on table public.member_administration_events to service_role;

create function public.bootstrap_personal_workspace_for_user(p_user_id uuid,p_name text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_workspace uuid; v_candidate_count integer; v_slug text;
begin
  if auth.role()<>'service_role' and auth.uid()<>p_user_id then raise exception 'personal_workspace_bootstrap_denied'; end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id) then raise exception 'personal_workspace_user_invalid'; end if;

  select workspace_id into v_workspace from public.account_personal_workspaces where user_id=p_user_id;
  if v_workspace is not null then return v_workspace; end if;

  select count(*),(array_agg(w.id))[1] into v_candidate_count,v_workspace
  from public.workspaces w join public.workspace_members wm on wm.workspace_id=w.id and wm.user_id=p_user_id
  where w.owner_id=p_user_id and w.status='active' and wm.role='owner' and wm.status='active';
  if v_candidate_count<>1 then
    v_workspace:=gen_random_uuid(); v_slug:='personal-'||replace(v_workspace::text,'-','');
    insert into public.workspaces(id,owner_id,slug,name,status) values(v_workspace,p_user_id,v_slug,left(coalesce(nullif(btrim(p_name),''),'Personal Workspace'),120),'active');
    insert into public.workspace_members(workspace_id,user_id,role,status) values(v_workspace,p_user_id,'owner','active');
  end if;
  insert into public.account_personal_workspaces(user_id,workspace_id) values(p_user_id,v_workspace)
  on conflict(user_id) do nothing returning workspace_id into v_workspace;
  if v_workspace is null then select workspace_id into v_workspace from public.account_personal_workspaces where user_id=p_user_id; end if;
  return v_workspace;
end $$;

create function public.resolve_personal_workspace()
returns uuid language plpgsql stable security definer set search_path='' as $$
declare v_workspace uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select apw.workspace_id into v_workspace from public.account_personal_workspaces apw
  join public.workspaces w on w.id=apw.workspace_id and w.status='active'
  join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=auth.uid() and wm.status='active'
  where apw.user_id=auth.uid();
  if v_workspace is null then raise exception 'personal_workspace_required'; end if;
  return v_workspace;
end $$;

create function public.record_member_administration_event(p_actor_user_id uuid,p_target_user_id uuid,p_workspace_id uuid,p_action text,p_outcome text,p_reason_code text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  insert into public.member_administration_events(actor_user_id,target_user_id,workspace_id,action,outcome,reason_code)
  values(p_actor_user_id,p_target_user_id,p_workspace_id,p_action,p_outcome,p_reason_code) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.bootstrap_personal_workspace_for_user(uuid,text) from public,anon;
revoke all on function public.resolve_personal_workspace() from public,anon;
revoke all on function public.record_member_administration_event(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.bootstrap_personal_workspace_for_user(uuid,text) to authenticated,service_role;
grant execute on function public.resolve_personal_workspace() to authenticated;
grant execute on function public.record_member_administration_event(uuid,uuid,uuid,text,text,text) to service_role;

commit;
