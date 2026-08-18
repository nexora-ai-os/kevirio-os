begin;

-- Phase 1.5: auditable legal acceptance and fail-closed account activation.
-- Legal text remains external, versioned content. This migration never records
-- acceptance on a user's behalf and never promotes an account automatically.
create extension if not exists pgcrypto;

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in (
    'TERMS','PRIVACY','AI_NOTICE','EXTERNAL_SERVICES_NOTICE','ADDITIONAL_CONSENT'
  )),
  document_version text not null check (document_version ~ '^[A-Z_]+_[0-9]+\.[0-9]+$'),
  lifecycle_status text not null default 'DRAFT' check (lifecycle_status in (
    'DRAFT','ACTIVE','SUPERSEDED','RECONSENT_REQUIRED'
  )),
  mandatory boolean not null default true,
  material_revision boolean not null default false,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  content_reference text not null check (length(btrim(content_reference)) between 1 and 500),
  effective_at timestamptz,
  created_at timestamptz not null default now(),
  constraint legal_documents_type_version_unique unique(document_type,document_version)
);

create unique index legal_documents_one_current_mandatory
  on public.legal_documents(document_type)
  where mandatory and lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED');

create table public.user_account_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lifecycle_state text not null default 'CONSENT_REQUIRED' check (lifecycle_state in (
    'INVITED','REGISTERING','LEGAL_REVIEW_REQUIRED','CONSENT_REQUIRED',
    'ACTIVE','SUSPENDED','DEACTIVATED'
  )),
  activated_at timestamptz,
  suspended_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((lifecycle_state <> 'ACTIVE') or activated_at is not null)
);

create table public.user_consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id),
  legal_document_id uuid not null references public.legal_documents(id),
  document_type text not null,
  document_version text not null,
  policy_hash text not null check (policy_hash ~ '^[a-f0-9]{64}$'),
  acceptance_status text not null default 'ACCEPTED' check (acceptance_status in (
    'ACCEPTED','WITHDRAWN','SUPERSEDED'
  )),
  consent_method text not null check (consent_method in ('AFFIRMATIVE_CHECKBOX')),
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  superseded_at timestamptz,
  technical_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_consent_document_unique unique(user_id,legal_document_id),
  check (octet_length(technical_evidence::text) <= 2048),
  check (not (technical_evidence ?| array['ip','ip_address','fingerprint','device_id','token','authorization','cookie']))
);

create index user_consent_records_user_status_idx
  on public.user_consent_records(user_id,acceptance_status,accepted_at desc);

alter table public.legal_documents enable row level security;
alter table public.user_account_states enable row level security;
alter table public.user_consent_records enable row level security;

create policy legal_documents_authenticated_read on public.legal_documents
  for select to authenticated
  using (lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED','SUPERSEDED'));
create policy account_state_self_read on public.user_account_states
  for select to authenticated using (user_id=auth.uid());
create policy consent_record_self_read on public.user_consent_records
  for select to authenticated using (user_id=auth.uid());

revoke all on public.legal_documents,public.user_account_states,public.user_consent_records from anon,authenticated;
grant select on public.legal_documents,public.user_account_states,public.user_consent_records to authenticated;
grant all on public.legal_documents,public.user_account_states,public.user_consent_records to service_role;

create function public.has_current_required_consents(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=''
as $$
  select p_user_id=auth.uid() and not exists (
    select 1 from public.legal_documents d
    where d.mandatory and d.lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED')
      and not exists (
        select 1 from public.user_consent_records c
        where c.user_id=p_user_id and c.legal_document_id=d.id
          and c.acceptance_status='ACCEPTED'
          and c.document_type=d.document_type
          and c.document_version=d.document_version
          and c.policy_hash=d.content_hash
      )
  )
  and exists (
    select 1 from public.legal_documents d
    where d.mandatory and d.lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED')
  );
$$;

create function public.accept_required_legal_documents(
  p_acceptances jsonb,
  p_workspace_id uuid default null,
  p_technical_evidence jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=auth.uid();
  v_document public.legal_documents;
  v_acceptance jsonb;
  v_required_count integer;
  v_inserted_count integer:=0;
begin
  if v_user is null or auth.role()<>'authenticated' then
    raise exception 'authentication_required';
  end if;
  if jsonb_typeof(coalesce(p_acceptances,'null'::jsonb))<>'array' then
    raise exception 'acceptances_array_required';
  end if;
  if octet_length(coalesce(p_technical_evidence,'{}'::jsonb)::text)>2048
    or coalesce(p_technical_evidence,'{}'::jsonb) ?| array['ip','ip_address','fingerprint','device_id','token','authorization','cookie'] then
    raise exception 'technical_evidence_not_allowed';
  end if;
  if p_workspace_id is not null and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=v_user and wm.status='active'
  ) then raise exception 'workspace_access_denied'; end if;

  select count(*) into v_required_count from public.legal_documents
  where mandatory and lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED');
  if v_required_count=0 or jsonb_array_length(p_acceptances)<>v_required_count then
    raise exception 'all_current_mandatory_documents_required';
  end if;

  for v_acceptance in select value from jsonb_array_elements(p_acceptances)
  loop
    if coalesce((v_acceptance->>'accepted')::boolean,false) is not true then
      raise exception 'affirmative_acceptance_required';
    end if;
    select * into v_document from public.legal_documents
    where id=(v_acceptance->>'documentId')::uuid
      and mandatory and lifecycle_status in ('ACTIVE','RECONSENT_REQUIRED')
      and document_version=v_acceptance->>'documentVersion'
      and content_hash=v_acceptance->>'policyHash';
    if not found then raise exception 'document_version_or_hash_mismatch'; end if;

    insert into public.user_consent_records(
      user_id,workspace_id,legal_document_id,document_type,document_version,
      policy_hash,acceptance_status,consent_method,technical_evidence
    ) values (
      v_user,p_workspace_id,v_document.id,v_document.document_type,v_document.document_version,
      v_document.content_hash,'ACCEPTED','AFFIRMATIVE_CHECKBOX',coalesce(p_technical_evidence,'{}')
    ) on conflict(user_id,legal_document_id) do nothing;
    if found then v_inserted_count:=v_inserted_count+1; end if;
  end loop;

  if not public.has_current_required_consents(v_user) then
    raise exception 'required_consent_incomplete';
  end if;
  insert into public.user_account_states(user_id,lifecycle_state,activated_at)
  values(v_user,'ACTIVE',now())
  on conflict(user_id) do update set lifecycle_state='ACTIVE',activated_at=coalesce(public.user_account_states.activated_at,now()),updated_at=now()
  where public.user_account_states.lifecycle_state not in ('SUSPENDED','DEACTIVATED');
  if not found then raise exception 'account_activation_forbidden'; end if;

  return jsonb_build_object('status','ACTIVE','acceptedCount',v_inserted_count,'externalExecution',false);
end $$;

create function public.current_account_access_state()
returns text language sql stable security definer set search_path='' as $$
  select case
    when auth.uid() is null then 'UNAUTHENTICATED'
    when not exists(select 1 from public.user_account_states s where s.user_id=auth.uid()) then 'CONSENT_REQUIRED'
    when exists(select 1 from public.user_account_states s where s.user_id=auth.uid() and s.lifecycle_state in ('SUSPENDED','DEACTIVATED')) then
      (select s.lifecycle_state from public.user_account_states s where s.user_id=auth.uid())
    when public.has_current_required_consents(auth.uid())
      and exists(select 1 from public.user_account_states s where s.user_id=auth.uid() and s.lifecycle_state='ACTIVE') then 'ACTIVE'
    else 'CONSENT_REQUIRED'
  end;
$$;

revoke all on function public.has_current_required_consents(uuid) from public,anon;
revoke all on function public.accept_required_legal_documents(jsonb,uuid,jsonb) from public,anon;
revoke all on function public.current_account_access_state() from public,anon;
grant execute on function public.has_current_required_consents(uuid) to authenticated;
grant execute on function public.accept_required_legal_documents(jsonb,uuid,jsonb) to authenticated;
grant execute on function public.current_account_access_state() to authenticated;

commit;
