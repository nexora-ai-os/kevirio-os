begin;

-- Existing workspace, owner, revenue, cost, evidence, approval, AI employee and audit
-- authorities cannot encode Organization/Business/Team identity or their relationships.
-- This migration adds only those missing Company Core authorities.
create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  lifecycle_state text not null default 'active' check (lifecycle_state in ('draft','active','paused','archived')),
  policies jsonb not null default '{}'::jsonb check (public.ai_metadata_is_safe(policies)),
  default_locale text,
  default_timezone text,
  default_currency text check (default_currency is null or default_currency ~ '^[A-Z]{3}$'),
  external_execution_allowed boolean not null default false check (external_execution_allowed=false),
  idempotency_key text not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint organizations_id_workspace_unique unique(id,workspace_id),
  constraint organizations_workspace_slug_unique unique(workspace_id,slug),
  constraint organizations_workspace_idempotency_unique unique(workspace_id,idempotency_key)
);
create table public.organization_workspaces (
  organization_id uuid not null, workspace_id uuid not null references public.workspaces(id),
  relationship_type text not null default 'operating' check (relationship_type in ('home','operating','reporting')),
  status text not null default 'active' check (status in ('active','inactive')),
  external_execution_allowed boolean not null default false check (external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint organization_workspaces_pk primary key(organization_id,workspace_id),
  constraint organization_workspaces_organization_fk foreign key(organization_id) references public.organizations(id)
);
create table public.businesses (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  organization_id uuid not null, owner_id uuid not null references auth.users(id),
  name text not null check(length(btrim(name)) between 1 and 160),
  business_type text not null check (business_type in ('affiliate','agency','consulting','digital_product','subscription','saas','licensing','marketplace','internal','custom')),
  operating_status text not null default 'draft' check(operating_status in ('draft','active','paused','closed')),
  status text not null default 'active' check(status in ('draft','active','paused','archived')),
  lifecycle_state text not null default 'active' check(lifecycle_state in ('draft','active','paused','archived')),
  revenue_model jsonb not null default '{}'::jsonb check(public.ai_metadata_is_safe(revenue_model)),
  strategy_reference text, profitability_status text, maturity text,
  safe_metadata jsonb not null default '{}'::jsonb check(public.ai_metadata_is_safe(safe_metadata)),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  idempotency_key text not null, request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint businesses_id_workspace_unique unique(id,workspace_id),
  constraint businesses_workspace_idempotency_unique unique(workspace_id,idempotency_key),
  constraint businesses_organization_workspace_fk foreign key(organization_id,workspace_id) references public.organization_workspaces(organization_id,workspace_id)
);
create table public.teams (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), organization_id uuid not null,
  business_id uuid, name text not null check(length(btrim(name)) between 1 and 160),
  role_scope text[] not null default '{}', permissions text[] not null default '{}', membership_status text not null default 'active' check(membership_status in ('active','inactive')),
  status text not null default 'active' check(status in ('draft','active','paused','archived')), lifecycle_state text not null default 'active' check(lifecycle_state in ('draft','active','paused','archived')),
  safe_metadata jsonb not null default '{}'::jsonb check(public.ai_metadata_is_safe(safe_metadata)), external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  idempotency_key text not null, request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint teams_id_workspace_unique unique(id,workspace_id), constraint teams_workspace_idempotency_unique unique(workspace_id,idempotency_key),
  constraint teams_organization_workspace_fk foreign key(organization_id,workspace_id) references public.organization_workspaces(organization_id,workspace_id),
  constraint teams_business_workspace_fk foreign key(business_id,workspace_id) references public.businesses(id,workspace_id)
);
create table public.team_memberships (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, team_id uuid not null, user_id uuid not null,
  role text not null check(role in ('owner','admin','member','reviewer')), permissions text[] not null default '{}', status text not null default 'active' check(status in ('active','inactive')),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint team_memberships_team_user_unique unique(team_id,user_id), constraint team_memberships_team_workspace_fk foreign key(team_id,workspace_id) references public.teams(id,workspace_id),
  constraint team_memberships_workspace_member_fk foreign key(workspace_id,user_id) references public.workspace_members(workspace_id,user_id)
);

create index organizations_workspace_status_idx on public.organizations(workspace_id,status,updated_at desc);
create index organization_workspaces_workspace_idx on public.organization_workspaces(workspace_id,status,updated_at desc);
create index businesses_workspace_org_status_idx on public.businesses(workspace_id,organization_id,operating_status,updated_at desc);
create index teams_workspace_business_status_idx on public.teams(workspace_id,business_id,status,updated_at desc);
create index team_memberships_workspace_user_idx on public.team_memberships(workspace_id,user_id,status);

create function public.touch_v3_company_core_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['organizations','organization_workspaces','businesses','teams','team_memberships'] loop execute format('create trigger %I before update on public.%I for each row execute function public.touch_v3_company_core_updated_at()',t||'_touch_updated_at',t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['organizations','organization_workspaces','businesses','teams','team_memberships'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy v3_company_core_owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active'' and op.role=''owner'' and op.status=''active''))',t,t);
 execute format('revoke all on public.%I from anon, authenticated',t); execute format('grant select on public.%I to authenticated',t); execute format('grant all on public.%I to service_role',t);
end loop; end $$;

create function public.register_v3_organization(p_workspace_id uuid,p_owner_id uuid,p_name text,p_slug text,p_policies jsonb,p_default_locale text,p_default_timezone text,p_default_currency text,p_idempotency_key text,p_request_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.organizations; begin
 if not exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=p_workspace_id and wm.user_id=p_owner_id and wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active') then raise exception 'v3_owner_workspace_invalid'; end if;
 if not public.ai_metadata_is_safe(coalesce(p_policies,'{}')) then raise exception 'v3_metadata_invalid'; end if;
 insert into public.organizations(workspace_id,owner_id,name,slug,policies,default_locale,default_timezone,default_currency,idempotency_key,request_hash) values(p_workspace_id,p_owner_id,p_name,p_slug,coalesce(p_policies,'{}'),p_default_locale,p_default_timezone,p_default_currency,p_idempotency_key,p_request_hash) on conflict(workspace_id,idempotency_key) do nothing returning * into v;
 if not found then select * into v from public.organizations where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key; if v.request_hash<>p_request_hash then raise exception 'v3_idempotency_conflict'; end if; end if;
 insert into public.organization_workspaces(organization_id,workspace_id,relationship_type) values(v.id,p_workspace_id,'home') on conflict do nothing;
 insert into public.company_operating_events(workspace_id,event_type,entity_type,entity_id,actor_type,actor_id,safe_metadata) values(p_workspace_id,'organization_registered','organization',v.id,'owner',p_owner_id::text,jsonb_build_object('status',v.status));
 return jsonb_build_object('id',v.id,'status',v.status,'external_execution',false);
end $$;
create function public.register_v3_business(p_workspace_id uuid,p_owner_id uuid,p_organization_id uuid,p_name text,p_business_type text,p_revenue_model jsonb,p_idempotency_key text,p_request_hash text) returns jsonb language plpgsql security definer set search_path='' as $$ declare v public.businesses; begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_owner_id and role='owner' and status='active') then raise exception 'v3_owner_workspace_invalid'; end if;
 insert into public.businesses(workspace_id,organization_id,owner_id,name,business_type,revenue_model,idempotency_key,request_hash) values(p_workspace_id,p_organization_id,p_owner_id,p_name,p_business_type,coalesce(p_revenue_model,'{}'),p_idempotency_key,p_request_hash) on conflict(workspace_id,idempotency_key) do nothing returning * into v;
 if not found then select * into v from public.businesses where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key; if v.request_hash<>p_request_hash then raise exception 'v3_idempotency_conflict'; end if; end if;
 insert into public.company_operating_events(workspace_id,event_type,entity_type,entity_id,actor_type,actor_id,safe_metadata) values(p_workspace_id,'business_registered','business',v.id,'owner',p_owner_id::text,jsonb_build_object('business_type',v.business_type)); return jsonb_build_object('id',v.id,'status',v.status,'external_execution',false); end $$;
create function public.register_v3_team(p_workspace_id uuid,p_owner_id uuid,p_organization_id uuid,p_business_id uuid,p_name text,p_role_scope text[],p_permissions text[],p_idempotency_key text,p_request_hash text) returns jsonb language plpgsql security definer set search_path='' as $$ declare v public.teams; begin
 if not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_owner_id and role='owner' and status='active') then raise exception 'v3_owner_workspace_invalid'; end if;
 insert into public.teams(workspace_id,organization_id,business_id,name,role_scope,permissions,idempotency_key,request_hash) values(p_workspace_id,p_organization_id,p_business_id,p_name,coalesce(p_role_scope,'{}'),coalesce(p_permissions,'{}'),p_idempotency_key,p_request_hash) on conflict(workspace_id,idempotency_key) do nothing returning * into v;
 if not found then select * into v from public.teams where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key; if v.request_hash<>p_request_hash then raise exception 'v3_idempotency_conflict'; end if; end if;
 insert into public.company_operating_events(workspace_id,event_type,entity_type,entity_id,actor_type,actor_id,safe_metadata) values(p_workspace_id,'team_registered','team',v.id,'owner',p_owner_id::text,jsonb_build_object('status',v.status)); return jsonb_build_object('id',v.id,'status',v.status,'external_execution',false); end $$;

revoke all on function public.register_v3_organization(uuid,uuid,text,text,jsonb,text,text,text,text,text) from public,anon,authenticated; grant execute on function public.register_v3_organization(uuid,uuid,text,text,jsonb,text,text,text,text,text) to service_role;
revoke all on function public.register_v3_business(uuid,uuid,uuid,text,text,jsonb,text,text) from public,anon,authenticated; grant execute on function public.register_v3_business(uuid,uuid,uuid,text,text,jsonb,text,text) to service_role;
revoke all on function public.register_v3_team(uuid,uuid,uuid,uuid,text,text[],text[],text,text) from public,anon,authenticated; grant execute on function public.register_v3_team(uuid,uuid,uuid,uuid,text,text[],text[],text,text) to service_role;
commit;
