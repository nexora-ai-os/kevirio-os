begin;

-- Personal operational records are private to their data owner by default.
-- Owner/admin status never grants implicit access to another user's record.
create extension if not exists pgcrypto;

create table public.personal_operational_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  data_owner_id uuid not null references auth.users(id),
  record_type text not null check(record_type in ('CONTENT','OPPORTUNITY','FEEDBACK')),
  visibility text not null default 'PRIVATE' check(visibility in ('PRIVATE','EXPLICIT_SHARED','TEAM')),
  team_id uuid,
  title text not null default '' check(length(title)<=240),
  payload jsonb not null default '{}'::jsonb,
  lifecycle_status text not null default 'DRAFT' check(lifecycle_status in ('DRAFT','ACTIVE','ARCHIVED','DELETED')),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_record_owner_membership_fk foreign key(workspace_id,data_owner_id)
    references public.workspace_members(workspace_id,user_id),
  constraint personal_record_team_fk foreign key(team_id,workspace_id)
    references public.teams(id,workspace_id),
  check(octet_length(payload::text)<=262144),
  check(not (payload ?| array['password','access_token','refresh_token','service_role_key','authorization','cookie'])),
  check((visibility='TEAM' and team_id is not null) or (visibility<>'TEAM' and team_id is null))
);

create table public.personal_record_shares (
  record_id uuid not null references public.personal_operational_records(id) on delete cascade,
  grantee_user_id uuid not null references auth.users(id),
  permission text not null check(permission in ('READ','EDIT')),
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(record_id,grantee_user_id),
  check(grantee_user_id<>granted_by)
);

create index personal_records_owner_type_idx
  on public.personal_operational_records(data_owner_id,record_type,lifecycle_status,updated_at desc);
create index personal_records_workspace_team_idx
  on public.personal_operational_records(workspace_id,team_id,updated_at desc) where visibility='TEAM';
create index personal_record_shares_grantee_idx on public.personal_record_shares(grantee_user_id,record_id);

alter table public.personal_operational_records enable row level security;
alter table public.personal_record_shares enable row level security;

create function public.is_active_workspace_principal(p_workspace_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $$
  select p_user_id=auth.uid()
    and exists(select 1 from public.workspace_members wm
      where wm.workspace_id=p_workspace_id and wm.user_id=p_user_id and wm.status='active')
    and exists(select 1 from public.user_account_states s
      where s.user_id=p_user_id and s.lifecycle_state='ACTIVE')
    and public.has_current_required_consents(p_user_id);
$$;

create function public.can_read_personal_record(p_record_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $$
  select p_user_id=auth.uid() and exists(
    select 1 from public.personal_operational_records r
    where r.id=p_record_id and r.lifecycle_status<>'DELETED'
      and public.is_active_workspace_principal(r.workspace_id,p_user_id)
      and (
        r.data_owner_id=p_user_id
        or (r.visibility='EXPLICIT_SHARED' and exists(
          select 1 from public.personal_record_shares s
          where s.record_id=r.id and s.grantee_user_id=p_user_id
        ))
        or (r.visibility='TEAM' and exists(
          select 1 from public.team_memberships tm
          where tm.workspace_id=r.workspace_id and tm.team_id=r.team_id
            and tm.user_id=p_user_id and tm.status='active'
        ))
      )
  );
$$;

create policy personal_records_permission_read on public.personal_operational_records
  for select to authenticated using(public.can_read_personal_record(id,auth.uid()));
create policy personal_shares_participant_read on public.personal_record_shares
  for select to authenticated using(exists(
    select 1 from public.personal_operational_records r
    where r.id=record_id
      and public.is_active_workspace_principal(r.workspace_id,auth.uid())
      and (
        r.data_owner_id=auth.uid()
        or (r.visibility='EXPLICIT_SHARED' and grantee_user_id=auth.uid())
      )
  ));

revoke all on public.personal_operational_records,public.personal_record_shares from anon,authenticated;
grant select on public.personal_operational_records,public.personal_record_shares to authenticated;
grant all on public.personal_operational_records,public.personal_record_shares to service_role;

create function public.save_personal_operational_record(
  p_workspace_id uuid,p_record_id uuid,p_record_type text,p_title text,p_payload jsonb,
  p_lifecycle_status text default 'DRAFT'
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if not public.is_active_workspace_principal(p_workspace_id,v_user) then raise exception 'personal_workspace_access_denied'; end if;
  if p_record_type not in ('CONTENT','OPPORTUNITY','FEEDBACK') then raise exception 'personal_record_type_invalid'; end if;
  if p_lifecycle_status not in ('DRAFT','ACTIVE','ARCHIVED') then raise exception 'personal_record_status_invalid'; end if;
  if octet_length(coalesce(p_payload,'{}')::text)>262144
    or coalesce(p_payload,'{}') ?| array['password','access_token','refresh_token','service_role_key','authorization','cookie'] then
    raise exception 'personal_record_payload_rejected';
  end if;
  if p_record_id is null then
    insert into public.personal_operational_records(workspace_id,data_owner_id,record_type,title,payload,lifecycle_status)
    values(p_workspace_id,v_user,p_record_type,left(coalesce(p_title,''),240),coalesce(p_payload,'{}'),p_lifecycle_status)
    returning id into v_id;
  else
    update public.personal_operational_records set title=left(coalesce(p_title,''),240),payload=coalesce(p_payload,'{}'),lifecycle_status=p_lifecycle_status,updated_at=now()
    where id=p_record_id and workspace_id=p_workspace_id and data_owner_id=v_user and record_type=p_record_type
    returning id into v_id;
    if v_id is null then raise exception 'personal_record_not_owned'; end if;
  end if;
  return v_id;
end $$;

create function public.set_personal_record_sharing(
  p_record_id uuid,p_visibility text,p_grantee_user_ids uuid[] default '{}',p_team_id uuid default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_record public.personal_operational_records;
begin
  select * into v_record from public.personal_operational_records where id=p_record_id for update;
  if v_record.id is null or v_record.data_owner_id<>v_user
    or not public.is_active_workspace_principal(v_record.workspace_id,v_user) then raise exception 'personal_record_not_owned'; end if;
  if p_visibility not in ('PRIVATE','EXPLICIT_SHARED','TEAM') then raise exception 'visibility_invalid'; end if;
  if p_visibility='TEAM' and (p_team_id is null or not exists(
    select 1 from public.team_memberships tm where tm.workspace_id=v_record.workspace_id
      and tm.team_id=p_team_id and tm.user_id=v_user and tm.status='active'
  )) then raise exception 'team_share_not_permitted'; end if;
  if p_visibility='EXPLICIT_SHARED' and exists(
    select 1 from unnest(coalesce(p_grantee_user_ids,'{}')) g
    where g=v_user or not exists(select 1 from public.workspace_members wm
      where wm.workspace_id=v_record.workspace_id and wm.user_id=g and wm.status='active')
  ) then raise exception 'share_grantee_invalid'; end if;

  delete from public.personal_record_shares where record_id=p_record_id;
  if p_visibility='EXPLICIT_SHARED' then
    insert into public.personal_record_shares(record_id,grantee_user_id,permission,granted_by)
    select p_record_id,g,'READ',v_user from unnest(coalesce(p_grantee_user_ids,'{}')) g;
  end if;
  update public.personal_operational_records
    set visibility=p_visibility,team_id=case when p_visibility='TEAM' then p_team_id else null end,updated_at=now()
    where id=p_record_id;
  return true;
end $$;

revoke all on function public.is_active_workspace_principal(uuid,uuid) from public,anon;
revoke all on function public.can_read_personal_record(uuid,uuid) from public,anon;
revoke all on function public.save_personal_operational_record(uuid,uuid,text,text,jsonb,text) from public,anon;
revoke all on function public.set_personal_record_sharing(uuid,text,uuid[],uuid) from public,anon;
grant execute on function public.is_active_workspace_principal(uuid,uuid) to authenticated;
grant execute on function public.can_read_personal_record(uuid,uuid) to authenticated;
grant execute on function public.save_personal_operational_record(uuid,uuid,text,text,jsonb,text) to authenticated;
grant execute on function public.set_personal_record_sharing(uuid,text,uuid[],uuid) to authenticated;

commit;
