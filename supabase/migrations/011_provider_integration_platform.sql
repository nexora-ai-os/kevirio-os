begin;

-- Backward-compatible expansion: Migration 010 remains unchanged; existing rows and locks are preserved.
alter table public.provider_cost_policies drop constraint if exists provider_cost_policies_provider_check;
alter table public.provider_cost_policies add constraint provider_cost_policies_provider_check check(provider in ('openai','anthropic','gemini','perplexity','canva','google'));

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), provider text not null check(provider in ('openai','anthropic','gemini','perplexity','google','canva')), connection_type text not null check(connection_type in ('api_key','oauth')), state text not null default 'locked' check(state in ('not_configured','credential_present','configuration_invalid','authorization_required','authorization_pending','connected','connected_scope_limited','token_expiring','refresh_failed','revoked','disconnected','suspended','locked','error')), provider_account_id text, provider_account_label text, token_ciphertext text, refresh_token_ciphertext text, token_expires_at timestamptz, token_type text, granted_scopes text[] not null default '{}', last_checked_at timestamptz, last_success_at timestamptz, last_error_class text, revoked_at timestamptz, created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,provider)
);
create table if not exists public.provider_oauth_states (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), owner_id uuid not null, provider text not null check(provider in ('google','canva')), state_hash text not null unique, pkce_verifier_ciphertext text not null, redirect_uri text not null, requested_scopes text[] not null default '{}', expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.provider_capabilities (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), provider text not null, capability text not null, request_class text not null, required_scopes text[] not null default '{}', maturity text not null default 'locked' check(maturity in ('production','conditional','mock','locked')), enabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,provider,capability,request_class)
);
create table if not exists public.provider_health_events (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), provider text not null, mode text not null check(mode in ('fixture','configuration','real')), status text not null, normalized_error text, correlation_id text, checked_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.provider_pricing_versions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), provider text not null, model text not null, currency text not null check(currency in ('JPY','USD')), input_per_million numeric not null check(input_per_million>=0), output_per_million numeric not null check(output_per_million>=0), cached_input_per_million numeric check(cached_input_per_million>=0), source_metadata jsonb not null default '{}', effective_at timestamptz not null, approved_by uuid not null, created_at timestamptz not null default now(), unique(workspace_id,provider,model,effective_at)
);

create index if not exists provider_connections_workspace_state_idx on public.provider_connections(workspace_id,state);
create index if not exists provider_oauth_states_expiry_idx on public.provider_oauth_states(workspace_id,provider,expires_at) where used_at is null;
create index if not exists provider_health_workspace_created_idx on public.provider_health_events(workspace_id,created_at desc);
create index if not exists provider_pricing_lookup_idx on public.provider_pricing_versions(workspace_id,provider,model,effective_at desc);

alter table public.provider_connections enable row level security;
alter table public.provider_oauth_states enable row level security;
alter table public.provider_capabilities enable row level security;
alter table public.provider_health_events enable row level security;
alter table public.provider_pricing_versions enable row level security;

do $$ declare t text; begin
  foreach t in array array['provider_connections','provider_oauth_states','provider_capabilities','provider_health_events','provider_pricing_versions'] loop
    execute format('drop policy if exists %I on public.%I','provider_platform_owner_read',t);
    execute format('create policy %I on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active''))','provider_platform_owner_read',t,t);
  end loop;
end $$;

revoke all on table public.provider_connections,public.provider_oauth_states,public.provider_capabilities,public.provider_health_events,public.provider_pricing_versions from public,anon,authenticated;
grant select on table public.provider_connections,public.provider_capabilities,public.provider_health_events,public.provider_pricing_versions to authenticated;
grant select,insert,update on table public.provider_connections,public.provider_oauth_states,public.provider_capabilities,public.provider_pricing_versions to service_role;
grant select,insert on table public.provider_health_events to service_role;

create or replace function public.consume_provider_oauth_state(p_state_hash text,p_workspace_id uuid,p_owner_id uuid,p_provider text,p_redirect_uri text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.provider_oauth_states;
begin
  update public.provider_oauth_states set used_at=now() where state_hash=p_state_hash and workspace_id=p_workspace_id and owner_id=p_owner_id and provider=p_provider and redirect_uri=p_redirect_uri and used_at is null and expires_at>now() returning * into s;
  if not found then raise exception 'oauth_state_invalid'; end if;
  return jsonb_build_object('oauthStateId',s.id,'pkceVerifierCiphertext',s.pkce_verifier_ciphertext,'requestedScopes',s.requested_scopes);
end $$;
create or replace function public.disconnect_provider_connection(p_workspace_id uuid,p_provider text,p_owner_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=p_owner_id and wm.role='owner' and wm.status='active') then raise exception 'workspace_access_denied'; end if;
  update public.provider_connections set state='disconnected',token_ciphertext=null,refresh_token_ciphertext=null,token_expires_at=null,revoked_at=now(),updated_at=now() where workspace_id=p_workspace_id and provider=p_provider;
  if not found then raise exception 'provider_connection_not_found'; end if;
  return true;
end $$;
revoke all on function public.consume_provider_oauth_state(text,uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.disconnect_provider_connection(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.consume_provider_oauth_state(text,uuid,uuid,text,text) to service_role;
grant execute on function public.disconnect_provider_connection(uuid,text,uuid) to service_role;

do $$ begin
  if has_table_privilege('anon','public.provider_connections','select') then raise exception 'provider_connections_anon_access'; end if;
  if has_function_privilege('authenticated','public.consume_provider_oauth_state(text,uuid,uuid,text,text)','execute') then raise exception 'oauth_rpc_authenticated_access'; end if;
end $$;

commit;
