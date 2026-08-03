begin;

-- Migration 012 is intentionally self-contained because it has not been applied remotely.
-- All runtime mutations enter through service-role-only protected RPCs.
create extension if not exists pgcrypto;

do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.approval_requests'::regclass and conname='approval_requests_id_workspace_unique') then
    alter table public.approval_requests add constraint approval_requests_id_workspace_unique unique (id, workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.provider_connections'::regclass and conname='provider_connections_id_workspace_unique') then
    alter table public.provider_connections add constraint provider_connections_id_workspace_unique unique (id, workspace_id);
  end if;
end $$;

create or replace function public.ai_metadata_is_safe(
  p_value jsonb,
  p_depth integer default 0
) returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  v_key text;
  v_child jsonb;
  v_text text;
begin
  if p_value is null then return true; end if;
  if p_depth > 6 or pg_column_size(p_value) > 32768 then return false; end if;

  case jsonb_typeof(p_value)
    when 'object' then
      for v_key, v_child in select key, value from jsonb_each(p_value)
      loop
        if lower(v_key) ~ '(token|secret|password|credential|authorization|cookie|prompt|mail.?body|message.?body|file.?body|calendar.?body|raw.?content|oauth.?code|private.?key|client.?secret)'
          or not public.ai_metadata_is_safe(v_child, p_depth + 1) then
          return false;
        end if;
      end loop;
    when 'array' then
      for v_child in select value from jsonb_array_elements(p_value)
      loop
        if not public.ai_metadata_is_safe(v_child, p_depth + 1) then return false; end if;
      end loop;
    when 'string' then
      v_text := p_value #>> '{}';
      if length(v_text) > 4096
        or v_text ~* '(bearer[[:space:]]+[a-z0-9._-]{12,}|-----begin .*private key-----|sk-[a-z0-9_-]{12,})' then
        return false;
      end if;
    else null;
  end case;
  return true;
end $$;

create table if not exists public.ai_employee_definitions (
  id text primary key,
  name text not null,
  role text not null,
  department text not null,
  responsibility text not null,
  version text not null,
  maturity text not null check (maturity in ('Production','Conditional','Mock','Locked')),
  provider text,
  external_execution_allowed boolean not null default false check (external_execution_allowed = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_employee_capabilities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  ai_employee_id text not null references public.ai_employee_definitions(id),
  capability text not null,
  service text not null,
  permission_class text not null check (permission_class in ('read','draft','write','send','publish','admin')),
  maturity text not null check (maturity in ('Production','Conditional','Mock','Locked')),
  required_scopes text[] not null default '{}',
  approval_required boolean not null default false,
  enabled boolean not null default false,
  quota_units integer not null default 0 check (quota_units >= 0),
  metadata jsonb not null default '{}' check (public.ai_metadata_is_safe(metadata)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, ai_employee_id, capability),
  unique (workspace_id, ai_employee_id, capability, service)
);

create table if not exists public.ai_employee_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  owner_id uuid not null references auth.users(id),
  ai_employee_id text not null references public.ai_employee_definitions(id),
  workflow_id text not null,
  task_key text not null,
  correlation_id text not null,
  capability text not null,
  purpose text not null check (length(purpose) between 1 and 500),
  status text not null check (status in (
    'draft','validated','dry_run_ready','awaiting_connection','awaiting_scope',
    'awaiting_approval','ready','reserved','running','partial','completed',
    'failed','cancelled','expired'
  )),
  data_classification text not null check (data_classification in ('public','internal','confidential','restricted')),
  parameters_metadata jsonb not null default '{}' check (public.ai_metadata_is_safe(parameters_metadata)),
  idempotency_key text not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  max_api_calls integer not null check (max_api_calls between 0 and 50),
  max_records integer not null check (max_records between 0 and 1000),
  max_duration_ms integer not null check (max_duration_ms between 1 and 30000),
  cost_ceiling_jpy numeric(14,6) not null check (cost_ceiling_jpy >= 0),
  approval_id uuid,
  approval_consumed_at timestamptz,
  retry_count integer not null default 0 check (retry_count between 0 and 1),
  event_sequence integer not null default 0 check (event_sequence >= 0),
  expires_at timestamptz,
  retention_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, ai_employee_id, idempotency_key),
  unique (approval_id),
  foreign key (workspace_id, ai_employee_id, capability)
    references public.ai_employee_capabilities(workspace_id, ai_employee_id, capability),
  foreign key (approval_id, workspace_id)
    references public.approval_requests(id, workspace_id),
  check ((approval_id is null and approval_consumed_at is null) or approval_id is not null),
  check (retention_until > created_at)
);

create table if not exists public.ai_employee_task_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  task_id uuid not null,
  sequence integer not null check (sequence > 0),
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_]{1,63}$'),
  from_status text,
  status text not null,
  normalized_error text check (normalized_error is null or (length(normalized_error) <= 256 and normalized_error !~* '(token|secret|password|bearer|prompt|body|credential)')),
  metrics jsonb not null default '{}' check (public.ai_metadata_is_safe(metrics)),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (task_id, sequence),
  unique (task_id, idempotency_key),
  foreign key (task_id, workspace_id)
    references public.ai_employee_tasks(id, workspace_id)
);

create table if not exists public.ai_employee_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  source_employee_id text not null,
  source_capability text not null,
  target_employee_id text not null,
  target_capability text not null,
  task_id uuid not null,
  parent_handoff_id uuid,
  correlation_id text not null,
  depth integer not null default 1 check (depth between 1 and 8),
  classification text not null check (classification in ('public','internal','confidential','restricted')),
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','cancelled','expired')),
  field_manifest text[] not null default '{}',
  metadata jsonb not null default '{}' check (public.ai_metadata_is_safe(metadata)),
  approval_id uuid,
  cost_ceiling_jpy numeric(14,6) not null check (cost_ceiling_jpy >= 0),
  retention_until timestamptz not null,
  idempotency_key text not null,
  raw_content_included boolean not null default false check (raw_content_included = false),
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, idempotency_key),
  foreign key (task_id, workspace_id) references public.ai_employee_tasks(id, workspace_id),
  foreign key (parent_handoff_id, workspace_id) references public.ai_employee_handoffs(id, workspace_id),
  foreign key (workspace_id, source_employee_id, source_capability)
    references public.ai_employee_capabilities(workspace_id, ai_employee_id, capability),
  foreign key (workspace_id, target_employee_id, target_capability)
    references public.ai_employee_capabilities(workspace_id, ai_employee_id, capability),
  foreign key (approval_id, workspace_id) references public.approval_requests(id, workspace_id),
  check (source_employee_id <> target_employee_id),
  check (cardinality(field_manifest) between 1 and 64),
  check (retention_until > created_at)
);

create table if not exists public.google_workspace_bindings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  provider_connection_id uuid not null,
  expected_account_id text,
  analytics_property_id text,
  search_console_site_url text,
  youtube_channel_id text,
  state text not null default 'locked' check (state in ('locked','conditional','ready','error')),
  safe_metadata jsonb not null default '{}' check (public.ai_metadata_is_safe(safe_metadata)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id),
  foreign key (provider_connection_id, workspace_id)
    references public.provider_connections(id, workspace_id)
);

create table if not exists public.google_quota_policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  service text not null,
  capability text not null,
  unit_type text not null default 'call' check (unit_type in ('call','youtube_unit')),
  timezone_name text not null default 'Asia/Tokyo',
  daily_unit_limit integer not null check (daily_unit_limit between 0 and 1000000),
  per_task_unit_limit integer not null check (per_task_unit_limit between 0 and 100000),
  per_workflow_unit_limit integer not null check (per_workflow_unit_limit between 0 and 1000000),
  concurrency_limit integer not null default 1 check (concurrency_limit between 1 and 10),
  page_limit integer not null default 10 check (page_limit between 1 and 100),
  record_limit integer not null default 1000 check (record_limit between 1 and 1000),
  enabled boolean not null default false,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, service, capability, unit_type)
);

create table if not exists public.google_quota_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  policy_id uuid not null references public.google_quota_policies(id),
  service text not null,
  capability text not null,
  unit_type text not null check (unit_type in ('call','youtube_unit')),
  workflow_id text not null,
  task_id uuid not null,
  idempotency_key text not null,
  estimated_units integer not null check (estimated_units >= 0),
  actual_units integer check (actual_units >= 0),
  retry_count integer not null default 0 check (retry_count between 0 and 1),
  status text not null check (status in ('reserved','committed','released','failed','expired')),
  usage_date date not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, service, idempotency_key),
  foreign key (task_id, workspace_id) references public.ai_employee_tasks(id, workspace_id)
);

create index if not exists ai_tasks_workspace_status_idx on public.ai_employee_tasks(workspace_id, status, updated_at desc);
create index if not exists ai_tasks_workflow_status_idx on public.ai_employee_tasks(workspace_id, workflow_id, status);
create index if not exists ai_tasks_retention_idx on public.ai_employee_tasks(retention_until);
create index if not exists ai_events_task_created_idx on public.ai_employee_task_events(task_id, sequence);
create index if not exists ai_events_workspace_type_idx on public.ai_employee_task_events(workspace_id, event_type, created_at desc);
create index if not exists ai_handoffs_workspace_idx on public.ai_employee_handoffs(workspace_id, status, created_at desc);
create index if not exists ai_handoffs_task_idx on public.ai_employee_handoffs(task_id, depth);
create index if not exists ai_handoffs_retention_idx on public.ai_employee_handoffs(retention_until);
create index if not exists google_quota_workspace_date_idx on public.google_quota_usage(workspace_id, service, usage_date, status);
create index if not exists google_quota_expiry_idx on public.google_quota_usage(status, expires_at);

insert into public.ai_employee_definitions(
  id,name,role,department,responsibility,version,maturity,provider
) values (
  'google_operations','Google Operations AI Employee','Google services operations',
  'Operations','Prepare bounded Google workspace operations without external execution',
  '1.1.0','Conditional','google'
) on conflict (id) do nothing;

create or replace function public.ai_task_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable set search_path = ''
as $$
  select (p_from,p_to) in (
    ('draft','validated'),('draft','cancelled'),
    ('validated','dry_run_ready'),('validated','awaiting_connection'),
    ('validated','awaiting_scope'),('validated','awaiting_approval'),('validated','cancelled'),
    ('dry_run_ready','awaiting_connection'),('dry_run_ready','awaiting_scope'),
    ('dry_run_ready','awaiting_approval'),('dry_run_ready','ready'),
    ('dry_run_ready','cancelled'),('dry_run_ready','expired'),
    ('awaiting_connection','dry_run_ready'),('awaiting_connection','cancelled'),('awaiting_connection','expired'),
    ('awaiting_scope','dry_run_ready'),('awaiting_scope','cancelled'),('awaiting_scope','expired'),
    ('awaiting_approval','ready'),('awaiting_approval','cancelled'),('awaiting_approval','expired'),
    ('ready','reserved'),('ready','cancelled'),('ready','expired'),
    ('reserved','running'),('reserved','failed'),('reserved','cancelled'),('reserved','expired'),
    ('running','partial'),('running','completed'),('running','failed'),('running','cancelled'),
    ('partial','completed'),('partial','failed'),('partial','cancelled')
  )
$$;

create or replace function public.create_ai_employee_task(
  p_workspace_id uuid,
  p_owner_id uuid,
  p_ai_employee_id text,
  p_workflow_id text,
  p_task_key text,
  p_correlation_id text,
  p_capability text,
  p_purpose text,
  p_data_classification text,
  p_parameters_metadata jsonb,
  p_idempotency_key text,
  p_request_hash text,
  p_payload_hash text,
  p_max_api_calls integer,
  p_max_records integer,
  p_max_duration_ms integer,
  p_cost_ceiling_jpy numeric,
  p_approval_id uuid default null,
  p_expires_at timestamptz default null,
  p_retention_until timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_task public.ai_employee_tasks;
begin
  if p_workspace_id is null or p_owner_id is null
    or not exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=p_owner_id and wm.role='owner' and wm.status='active') then
    raise exception 'ai_task_owner_workspace_invalid';
  end if;
  if not public.ai_metadata_is_safe(coalesce(p_parameters_metadata,'{}'::jsonb)) then raise exception 'ai_task_metadata_invalid'; end if;
  if not exists(select 1 from public.ai_employee_capabilities c
    where c.workspace_id=p_workspace_id and c.ai_employee_id=p_ai_employee_id
      and c.capability=p_capability and c.enabled=true and c.maturity in ('Production','Conditional')) then
    raise exception 'ai_task_capability_unavailable';
  end if;
  if p_retention_until is not null and p_retention_until<=now() then raise exception 'ai_task_retention_invalid'; end if;

  insert into public.ai_employee_tasks(
    workspace_id,owner_id,ai_employee_id,workflow_id,task_key,correlation_id,
    capability,purpose,status,data_classification,parameters_metadata,idempotency_key,
    request_hash,payload_hash,max_api_calls,max_records,max_duration_ms,cost_ceiling_jpy,
    approval_id,expires_at,retention_until,event_sequence
  ) values (
    p_workspace_id,p_owner_id,p_ai_employee_id,p_workflow_id,p_task_key,p_correlation_id,
    p_capability,p_purpose,'validated',p_data_classification,coalesce(p_parameters_metadata,'{}'::jsonb),p_idempotency_key,
    p_request_hash,p_payload_hash,p_max_api_calls,p_max_records,p_max_duration_ms,p_cost_ceiling_jpy,
    p_approval_id,p_expires_at,coalesce(p_retention_until,now()+interval '90 days'),1
  ) returning * into v_task;
  insert into public.ai_employee_task_events(
    workspace_id,task_id,sequence,event_type,status,metrics,idempotency_key
  ) values (p_workspace_id,v_task.id,1,'task_validated','validated','{}'::jsonb,p_idempotency_key||':created');
  return jsonb_build_object('task_id',v_task.id,'status',v_task.status,'sequence',1,'external_execution',false);
exception when unique_violation then
  select * into v_task from public.ai_employee_tasks
   where workspace_id=p_workspace_id and ai_employee_id=p_ai_employee_id and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('task_id',v_task.id,'status',v_task.status,'sequence',v_task.event_sequence,'idempotent_replay',true,'external_execution',false); end if;
  raise;
end $$;

create or replace function public.transition_ai_employee_task(
  p_workspace_id uuid,
  p_task_id uuid,
  p_expected_status text,
  p_next_status text,
  p_event_type text,
  p_event_idempotency_key text,
  p_metrics jsonb default '{}'::jsonb,
  p_normalized_error text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_task public.ai_employee_tasks;
  v_sequence integer;
  v_approval public.approval_requests;
begin
  if not public.ai_metadata_is_safe(p_metrics)
    or p_event_type !~ '^[a-z][a-z0-9_]{1,63}$'
    or (p_normalized_error is not null and (length(p_normalized_error)>256 or p_normalized_error ~* '(token|secret|password|bearer|prompt|body|credential)')) then
    raise exception 'ai_event_payload_invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_task_id::text,0));
  select * into v_task from public.ai_employee_tasks
   where id=p_task_id and workspace_id=p_workspace_id for update;
  if not found then raise exception 'ai_task_not_found'; end if;
  if v_task.status <> p_expected_status then raise exception 'ai_task_stale_transition'; end if;
  if not public.ai_task_transition_allowed(v_task.status,p_next_status) then raise exception 'ai_task_transition_forbidden'; end if;
  if v_task.expires_at is not null and v_task.expires_at <= now() and p_next_status <> 'expired' then
    raise exception 'ai_task_expired';
  end if;

  if v_task.status='awaiting_approval' and p_next_status='ready' then
    if v_task.approval_id is null or v_task.approval_consumed_at is not null then raise exception 'ai_approval_required'; end if;
    select * into v_approval from public.approval_requests
      where id=v_task.approval_id and workspace_id=v_task.workspace_id for update;
    if not found or v_approval.status <> 'approved' or v_approval.requested_by<>v_task.owner_id
      or (v_approval.expires_at is not null and v_approval.expires_at<=now()) then
      raise exception 'ai_approval_invalid';
    end if;
    if v_approval.preview_snapshot->>'task_id' <> v_task.id::text
      or v_approval.preview_snapshot->>'workspace_id' <> v_task.workspace_id::text
      or v_approval.preview_snapshot->>'owner_id' <> v_task.owner_id::text
      or v_approval.preview_snapshot->>'ai_employee_id' <> v_task.ai_employee_id
      or v_approval.preview_snapshot->>'workflow_id' <> v_task.workflow_id
      or v_approval.preview_snapshot->>'capability' <> v_task.capability
      or v_approval.preview_snapshot->>'idempotency_key' <> v_task.idempotency_key
      or v_approval.preview_snapshot->>'request_hash' <> v_task.request_hash
      or v_approval.preview_snapshot->>'payload_hash' <> v_task.payload_hash then
      raise exception 'ai_approval_snapshot_mismatch';
    end if;
    if not exists(select 1 from public.approval_decisions d
      where d.approval_request_id=v_approval.id and d.workspace_id=v_task.workspace_id and d.decision='approve'
        and d.decision_snapshot=v_approval.preview_snapshot) then
      raise exception 'ai_approval_decision_mismatch';
    end if;
    update public.ai_employee_tasks set approval_consumed_at=now() where id=v_task.id;
  end if;

  v_sequence := v_task.event_sequence + 1;
  update public.ai_employee_tasks
    set status=p_next_status,event_sequence=v_sequence,updated_at=now()
    where id=v_task.id;
  insert into public.ai_employee_task_events(
    workspace_id,task_id,sequence,event_type,from_status,status,
    normalized_error,metrics,idempotency_key
  ) values (
    p_workspace_id,p_task_id,v_sequence,p_event_type,v_task.status,p_next_status,
    p_normalized_error,p_metrics,p_event_idempotency_key
  );
  return jsonb_build_object('task_id',p_task_id,'status',p_next_status,'sequence',v_sequence,'external_execution',false);
exception when unique_violation then
  if exists(select 1 from public.ai_employee_task_events where task_id=p_task_id and idempotency_key=p_event_idempotency_key) then
    return (select jsonb_build_object('task_id',p_task_id,'status',status,'sequence',sequence,'idempotent_replay',true,'external_execution',false)
      from public.ai_employee_task_events where task_id=p_task_id and idempotency_key=p_event_idempotency_key);
  end if;
  raise;
end $$;

create or replace function public.reserve_google_quota(
  p_workspace_id uuid,
  p_task_id uuid,
  p_service text,
  p_capability text,
  p_unit_type text,
  p_estimated_units integer,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_task public.ai_employee_tasks;
  v_policy public.google_quota_policies;
  v_usage public.google_quota_usage;
  v_usage_date date;
  v_daily integer;
  v_workflow integer;
  v_task_units integer;
  v_concurrent integer;
begin
  if p_estimated_units<0 or p_unit_type not in('call','youtube_unit') then raise exception 'google_quota_request_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text||':'||p_service||':'||p_capability||':'||p_unit_type,0));

  select * into v_task from public.ai_employee_tasks where id=p_task_id and workspace_id=p_workspace_id for update;
  if not found or v_task.status not in('ready','reserved') then raise exception 'google_quota_task_invalid'; end if;
  if v_task.capability<>p_capability then raise exception 'google_quota_capability_mismatch'; end if;

  select * into v_policy from public.google_quota_policies
   where workspace_id=p_workspace_id and service=p_service and capability=p_capability and unit_type=p_unit_type for update;
  if not found or not v_policy.enabled then raise exception 'google_quota_policy_locked'; end if;
  v_usage_date := (now() at time zone v_policy.timezone_name)::date;

  select * into v_usage from public.google_quota_usage
   where workspace_id=p_workspace_id and service=p_service and idempotency_key=p_idempotency_key;
  if found then
    return jsonb_build_object('reservation_id',v_usage.id,'status',v_usage.status,'idempotent_replay',true,'external_execution',false);
  end if;

  update public.google_quota_usage set status='expired',updated_at=now()
    where workspace_id=p_workspace_id and status='reserved' and expires_at<=now();

  select coalesce(sum(coalesce(actual_units,estimated_units)),0) into v_daily
    from public.google_quota_usage where workspace_id=p_workspace_id and service=p_service
      and capability=p_capability and unit_type=p_unit_type and usage_date=v_usage_date and status in('reserved','committed');
  select coalesce(sum(coalesce(actual_units,estimated_units)),0) into v_workflow
    from public.google_quota_usage where workspace_id=p_workspace_id and workflow_id=v_task.workflow_id
      and service=p_service and capability=p_capability and unit_type=p_unit_type and usage_date=v_usage_date and status in('reserved','committed');
  select coalesce(sum(coalesce(actual_units,estimated_units)),0) into v_task_units
    from public.google_quota_usage where workspace_id=p_workspace_id and task_id=p_task_id
      and service=p_service and capability=p_capability and unit_type=p_unit_type and status in('reserved','committed');
  select count(*) into v_concurrent from public.google_quota_usage
    where workspace_id=p_workspace_id and service=p_service and capability=p_capability and status='reserved' and expires_at>now();

  if v_daily+p_estimated_units>v_policy.daily_unit_limit
    or v_workflow+p_estimated_units>v_policy.per_workflow_unit_limit
    or v_task_units+p_estimated_units>v_policy.per_task_unit_limit
    or v_concurrent>=v_policy.concurrency_limit then
    raise exception 'google_quota_exceeded';
  end if;

  insert into public.google_quota_usage(
    workspace_id,policy_id,service,capability,unit_type,workflow_id,task_id,
    idempotency_key,estimated_units,status,usage_date,expires_at
  ) values (
    p_workspace_id,v_policy.id,p_service,p_capability,p_unit_type,v_task.workflow_id,p_task_id,
    p_idempotency_key,p_estimated_units,'reserved',v_usage_date,now()+interval '5 minutes'
  ) returning * into v_usage;
  return jsonb_build_object('reservation_id',v_usage.id,'status','reserved','estimated_units',p_estimated_units,'external_execution',false);
end $$;

create or replace function public.finalize_google_quota(
  p_workspace_id uuid,p_reservation_id uuid,p_actual_units integer,p_status text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_actual_units<0 or p_status not in('committed','failed') then raise exception 'google_quota_finalize_invalid'; end if;
  update public.google_quota_usage set actual_units=p_actual_units,status=p_status,updated_at=now()
   where id=p_reservation_id and workspace_id=p_workspace_id and status='reserved' and expires_at>now();
  if not found then raise exception 'google_quota_reservation_invalid'; end if;
  return true;
end $$;

create or replace function public.release_google_quota(
  p_workspace_id uuid,p_reservation_id uuid
) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.google_quota_usage set status='released',updated_at=now()
   where id=p_reservation_id and workspace_id=p_workspace_id and status='reserved';
  if not found then raise exception 'google_quota_reservation_invalid'; end if;
  return true;
end $$;

create or replace function public.create_ai_employee_handoff(
  p_workspace_id uuid,
  p_task_id uuid,
  p_source_capability text,
  p_target_employee_id text,
  p_target_capability text,
  p_classification text,
  p_field_manifest text[],
  p_metadata jsonb,
  p_parent_handoff_id uuid,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_task public.ai_employee_tasks;
  v_parent public.ai_employee_handoffs;
  v_depth integer := 1;
  v_id uuid;
  v_rank integer;
  v_task_rank integer;
begin
  if not public.ai_metadata_is_safe(p_metadata)
    or cardinality(p_field_manifest) not between 1 and 64
    or exists(select 1 from unnest(p_field_manifest) f where lower(f) ~ '(body|prompt|token|secret|credential|raw)') then
    raise exception 'ai_handoff_payload_invalid';
  end if;
  select * into v_task from public.ai_employee_tasks where id=p_task_id and workspace_id=p_workspace_id for update;
  if not found then raise exception 'ai_handoff_task_invalid'; end if;
  if v_task.ai_employee_id=p_target_employee_id then raise exception 'ai_handoff_self_loop'; end if;
  if not exists(select 1 from public.ai_employee_capabilities where workspace_id=p_workspace_id and ai_employee_id=v_task.ai_employee_id and capability=p_source_capability)
    or not exists(select 1 from public.ai_employee_capabilities where workspace_id=p_workspace_id and ai_employee_id=p_target_employee_id and capability=p_target_capability and enabled) then
    raise exception 'ai_handoff_capability_invalid';
  end if;
  v_rank := array_position(array['public','internal','confidential','restricted'],p_classification);
  v_task_rank := array_position(array['public','internal','confidential','restricted'],v_task.data_classification);
  if v_rank is null or v_rank<v_task_rank then raise exception 'ai_handoff_classification_downgrade'; end if;

  if p_parent_handoff_id is not null then
    select * into v_parent from public.ai_employee_handoffs where id=p_parent_handoff_id and workspace_id=p_workspace_id for update;
    if not found or v_parent.task_id<>p_task_id or v_parent.correlation_id<>v_task.correlation_id then raise exception 'ai_handoff_parent_invalid'; end if;
    v_depth:=v_parent.depth+1;
    if v_depth>8 then raise exception 'ai_handoff_depth_exceeded'; end if;
    if exists(
      with recursive chain as (
        select id,parent_handoff_id,source_employee_id,target_employee_id from public.ai_employee_handoffs where id=p_parent_handoff_id
        union all
        select h.id,h.parent_handoff_id,h.source_employee_id,h.target_employee_id
          from public.ai_employee_handoffs h join chain c on h.id=c.parent_handoff_id
      ) select 1 from chain where source_employee_id=p_target_employee_id
    ) then raise exception 'ai_handoff_loop_detected'; end if;
  end if;

  insert into public.ai_employee_handoffs(
    workspace_id,source_employee_id,source_capability,target_employee_id,target_capability,
    task_id,parent_handoff_id,correlation_id,depth,classification,field_manifest,metadata,
    approval_id,cost_ceiling_jpy,retention_until,idempotency_key
  ) values (
    p_workspace_id,v_task.ai_employee_id,p_source_capability,p_target_employee_id,p_target_capability,
    p_task_id,p_parent_handoff_id,v_task.correlation_id,v_depth,p_classification,p_field_manifest,p_metadata,
    v_task.approval_id,v_task.cost_ceiling_jpy,v_task.retention_until,p_idempotency_key
  ) returning id into v_id;
  return jsonb_build_object('handoff_id',v_id,'depth',v_depth,'correlation_id',v_task.correlation_id,'external_execution',false);
exception when unique_violation then
  return (select jsonb_build_object('handoff_id',id,'depth',depth,'correlation_id',correlation_id,'idempotent_replay',true,'external_execution',false)
    from public.ai_employee_handoffs where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key);
end $$;

create or replace function public.reject_ai_event_mutation()
returns trigger language plpgsql set search_path = ''
as $$ begin raise exception 'ai_task_events_append_only'; end $$;
drop trigger if exists ai_task_events_immutable on public.ai_employee_task_events;
create trigger ai_task_events_immutable before update or delete on public.ai_employee_task_events for each row execute function public.reject_ai_event_mutation();

create or replace function public.touch_ai_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists ai_capabilities_touch on public.ai_employee_capabilities;
drop trigger if exists ai_tasks_touch on public.ai_employee_tasks;
drop trigger if exists google_bindings_touch on public.google_workspace_bindings;
drop trigger if exists google_policies_touch on public.google_quota_policies;
create trigger ai_capabilities_touch before update on public.ai_employee_capabilities for each row execute function public.touch_ai_updated_at();
create trigger ai_tasks_touch before update on public.ai_employee_tasks for each row execute function public.touch_ai_updated_at();
create trigger google_bindings_touch before update on public.google_workspace_bindings for each row execute function public.touch_ai_updated_at();
create trigger google_policies_touch before update on public.google_quota_policies for each row execute function public.touch_ai_updated_at();

do $$
declare t text;
begin
  foreach t in array array[
    'ai_employee_capabilities','ai_employee_tasks','ai_employee_task_events',
    'ai_employee_handoffs','google_workspace_bindings','google_quota_policies','google_quota_usage'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists ai_employee_owner_read on public.%I',t);
    execute format('create policy ai_employee_owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active''))',t,t);
  end loop;
end $$;

revoke all on table
  public.ai_employee_definitions,public.ai_employee_capabilities,public.ai_employee_tasks,
  public.ai_employee_task_events,public.ai_employee_handoffs,public.google_workspace_bindings,
  public.google_quota_policies,public.google_quota_usage
from public,anon,authenticated;
grant select on table
  public.ai_employee_definitions,public.ai_employee_capabilities,public.ai_employee_tasks,
  public.ai_employee_task_events,public.ai_employee_handoffs,public.google_workspace_bindings,
  public.google_quota_policies,public.google_quota_usage
to authenticated;
grant select on table
  public.ai_employee_definitions,public.ai_employee_capabilities,public.ai_employee_tasks,
  public.ai_employee_task_events,public.ai_employee_handoffs,public.google_workspace_bindings,
  public.google_quota_policies,public.google_quota_usage
to service_role;

revoke all on function public.transition_ai_employee_task(uuid,uuid,text,text,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.create_ai_employee_task(uuid,uuid,text,text,text,text,text,text,text,jsonb,text,text,text,integer,integer,integer,numeric,uuid,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.reserve_google_quota(uuid,uuid,text,text,text,integer,text) from public,anon,authenticated;
revoke all on function public.finalize_google_quota(uuid,uuid,integer,text) from public,anon,authenticated;
revoke all on function public.release_google_quota(uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_ai_employee_handoff(uuid,uuid,text,text,text,text,text[],jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.transition_ai_employee_task(uuid,uuid,text,text,text,text,jsonb,text) to service_role;
grant execute on function public.create_ai_employee_task(uuid,uuid,text,text,text,text,text,text,text,jsonb,text,text,text,integer,integer,integer,numeric,uuid,timestamptz,timestamptz) to service_role;
grant execute on function public.reserve_google_quota(uuid,uuid,text,text,text,integer,text) to service_role;
grant execute on function public.finalize_google_quota(uuid,uuid,integer,text) to service_role;
grant execute on function public.release_google_quota(uuid,uuid) to service_role;
grant execute on function public.create_ai_employee_handoff(uuid,uuid,text,text,text,text,text[],jsonb,uuid,text) to service_role;

do $$
begin
  if has_table_privilege('anon','public.ai_employee_tasks','select')
    or has_table_privilege('authenticated','public.ai_employee_tasks','insert')
    or has_function_privilege('authenticated','public.transition_ai_employee_task(uuid,uuid,text,text,text,text,jsonb,text)','execute')
    or has_function_privilege('authenticated','public.create_ai_employee_task(uuid,uuid,text,text,text,text,text,text,text,jsonb,text,text,text,integer,integer,integer,numeric,uuid,timestamptz,timestamptz)','execute') then
    raise exception 'ai_employee_privilege_boundary_invalid';
  end if;
end $$;

commit;
