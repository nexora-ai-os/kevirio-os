-- KEVIRIO M032: Affiliate revenue-cycle bridge (M001-M031 immutable)
begin;

do $$ begin
  if to_regclass('public.affiliate_program_master') is null or to_regclass('public.affiliate_strategies') is null
    or to_regclass('public.personal_operational_records') is null or to_regclass('public.revenue_records') is null
    or to_regprocedure('public.resolve_personal_workspace()') is null then raise exception 'm032_baseline_missing'; end if;
  if to_regclass('public.affiliate_cycle_publications') is not null or to_regclass('public.affiliate_cycle_performance') is not null
    or to_regclass('public.affiliate_revenue_candidates') is not null or to_regclass('public.affiliate_revenue_evidence') is not null
    then raise exception 'm032_existing_or_partial_state'; end if;
end $$;

create table public.affiliate_cycle_publications(
 id uuid primary key default extensions.gen_random_uuid(), workspace_id uuid not null, owner_user_id uuid not null,
 affiliate_program_id uuid not null references public.affiliate_program_master(id) on delete restrict,
 content_id uuid not null references public.personal_operational_records(id) on delete restrict,
 strategy_id uuid references public.affiliate_strategies(id) on delete restrict, research_id uuid references public.research_findings(id) on delete restrict,
 platform text not null check(length(btrim(platform)) between 1 and 80), external_url text,
 published_at timestamptz, execution_status text not null default 'DRAFT' check(execution_status in('DRAFT','READY_FOR_REVIEW','APPROVED_FOR_MANUAL_EXECUTION','EXECUTED_EXTERNALLY','FAILED','ARCHIVED')),
 version bigint not null default 1 check(version>0), provenance jsonb not null default '{}' check(jsonb_typeof(provenance)='object'),
 idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), archived_at timestamptz,
 foreign key(owner_user_id,workspace_id) references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
 unique(owner_user_id,idempotency_key), unique(id,workspace_id,owner_user_id),
 check((execution_status='EXECUTED_EXTERNALLY')=(external_url is not null and published_at is not null)),
 check(external_url is null or (external_url~'^https://[^[:space:]]+$' and length(external_url)<=2048)),
 check((execution_status='ARCHIVED')=(archived_at is not null))
);
create table public.affiliate_cycle_performance(
 id uuid primary key default extensions.gen_random_uuid(), workspace_id uuid not null, owner_user_id uuid not null,
 publication_id uuid not null, affiliate_program_id uuid not null references public.affiliate_program_master(id) on delete restrict,
 content_id uuid not null references public.personal_operational_records(id) on delete restrict,
 observed_at timestamptz not null, clicks bigint check(clicks>=0), conversions bigint check(conversions>=0),
 pending_reward_minor bigint check(pending_reward_minor>=0), confirmed_reward_minor bigint check(confirmed_reward_minor>=0), rejected_reward_minor bigint check(rejected_reward_minor>=0),
 currency text check(currency~'^[A-Z]{3}$'), source text not null check(source in('OWNER_MANUAL','ASP_SCREEN','ASP_EXPORT','PAYOUT_STATEMENT')),
 truth_class text not null default 'OWNER_REPORTED' check(truth_class in('OWNER_REPORTED','PROVIDER_REPORTED')),
 version bigint not null default 1 check(version>0), idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), archived_at timestamptz,
 foreign key(owner_user_id,workspace_id) references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
 foreign key(publication_id,workspace_id,owner_user_id) references public.affiliate_cycle_publications(id,workspace_id,owner_user_id) on delete restrict,
 unique(owner_user_id,idempotency_key), unique(id,workspace_id,owner_user_id),
 check(currency is not null or (pending_reward_minor is null and confirmed_reward_minor is null and rejected_reward_minor is null))
);
create table public.affiliate_revenue_candidates(
 id uuid primary key default extensions.gen_random_uuid(), workspace_id uuid not null, owner_user_id uuid not null,
 affiliate_program_id uuid not null references public.affiliate_program_master(id) on delete restrict,
 content_id uuid not null references public.personal_operational_records(id) on delete restrict,
 strategy_id uuid references public.affiliate_strategies(id) on delete restrict, research_id uuid references public.research_findings(id) on delete restrict,
 publication_id uuid not null, performance_id uuid not null,
 status text not null check(status in('UNKNOWN','PENDING','CANDIDATE','CONFIRMED_ACTUAL','REJECTED')),
 amount_minor bigint check(amount_minor>=0), currency text check(currency~'^[A-Z]{3}$'), reward_state text not null check(reward_state in('UNKNOWN','PENDING','CONFIRMED','REJECTED')),
 source text not null check(source in('OWNER_MANUAL','ASP_SCREEN','ASP_EXPORT','PAYOUT_STATEMENT')),
 conversion_at timestamptz, confirmation_at timestamptz, evidence_status text not null default 'MISSING' check(evidence_status in('MISSING','ATTACHED','VERIFIED','REJECTED')),
 provenance jsonb not null check(jsonb_typeof(provenance)='object' and provenance<>'{}'), version bigint not null default 1 check(version>0),
 idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'), actual_revenue_record_id uuid unique,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), archived_at timestamptz,
 foreign key(owner_user_id,workspace_id) references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
 foreign key(publication_id,workspace_id,owner_user_id) references public.affiliate_cycle_publications(id,workspace_id,owner_user_id) on delete restrict,
 foreign key(performance_id,workspace_id,owner_user_id) references public.affiliate_cycle_performance(id,workspace_id,owner_user_id) on delete restrict,
 unique(owner_user_id,idempotency_key), unique(id,workspace_id,owner_user_id),
 check((amount_minor is null)=(currency is null)),
 check(status<>'CONFIRMED_ACTUAL' or (reward_state='CONFIRMED' and evidence_status='VERIFIED' and amount_minor is not null and confirmation_at is not null and actual_revenue_record_id is not null))
);
create table public.affiliate_revenue_evidence(
 id uuid primary key default extensions.gen_random_uuid(), workspace_id uuid not null, owner_user_id uuid not null,
 candidate_id uuid not null, performance_id uuid not null, content_id uuid not null references public.personal_operational_records(id) on delete restrict,
 affiliate_program_id uuid not null references public.affiliate_program_master(id) on delete restrict,
 evidence_type text not null check(evidence_type in('ASP_CONFIRMED_CONVERSION','ASP_CONFIRMATION_SCREEN','PAYOUT_STATEMENT','OWNER_VERIFIED_PROOF')),
 source_reference text not null check(length(btrim(source_reference)) between 1 and 500), amount_minor bigint not null check(amount_minor>=0), currency text not null check(currency~'^[A-Z]{3}$'), occurred_at timestamptz not null,
 verification_status text not null default 'UNVERIFIED' check(verification_status in('UNVERIFIED','VERIFIED','REJECTED')),
 verified_by uuid, verified_at timestamptz, provenance jsonb not null check(jsonb_typeof(provenance)='object' and provenance<>'{}'),
 idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'), created_at timestamptz not null default clock_timestamp(),
 foreign key(owner_user_id,workspace_id) references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
 foreign key(candidate_id,workspace_id,owner_user_id) references public.affiliate_revenue_candidates(id,workspace_id,owner_user_id) on delete restrict,
 foreign key(performance_id,workspace_id,owner_user_id) references public.affiliate_cycle_performance(id,workspace_id,owner_user_id) on delete restrict,
 unique(owner_user_id,idempotency_key), unique(candidate_id,source_reference),
 check((verification_status='VERIFIED')=(verified_by is not null and verified_at is not null))
);

alter table public.revenue_records add column affiliate_revenue_candidate_id uuid unique references public.affiliate_revenue_candidates(id) on delete restrict;
alter table public.revenue_records add column origin_type text not null default 'LEGACY_CAMPAIGN' check(origin_type in('LEGACY_CAMPAIGN','AFFILIATE_PROGRAM'));
alter table public.revenue_records alter column brand_id drop not null;
alter table public.revenue_records alter column campaign_id drop not null;
alter table public.revenue_records alter column evidence_candidate_id drop not null;
alter table public.revenue_records add constraint revenue_records_origin_contract check(
 (origin_type='LEGACY_CAMPAIGN' and brand_id is not null and campaign_id is not null and evidence_candidate_id is not null and affiliate_revenue_candidate_id is null)
 or (origin_type='AFFILIATE_PROGRAM' and lane='affiliate' and brand_id is null and campaign_id is null and evidence_candidate_id is null and affiliate_revenue_candidate_id is not null));
alter table public.affiliate_revenue_candidates add foreign key(actual_revenue_record_id) references public.revenue_records(id) on delete restrict;

create index affiliate_publications_program_idx on public.affiliate_cycle_publications(owner_user_id,affiliate_program_id,created_at desc);
create index affiliate_performance_program_idx on public.affiliate_cycle_performance(owner_user_id,affiliate_program_id,observed_at desc);
create index affiliate_candidates_program_status_idx on public.affiliate_revenue_candidates(owner_user_id,affiliate_program_id,status,updated_at desc);
create index affiliate_evidence_candidate_idx on public.affiliate_revenue_evidence(owner_user_id,candidate_id,created_at desc);

create function public.m032_audit_cycle_change() returns trigger language plpgsql security definer set search_path='' as $$
declare o uuid:=coalesce(new.owner_user_id,old.owner_user_id);w uuid:=coalesce(new.workspace_id,old.workspace_id);x uuid:=coalesce(new.id,old.id);v bigint:=coalesce((to_jsonb(new)->>'version')::bigint,1);k text;ot text;ev text;st text;
begin
 ot:=case tg_table_name when 'affiliate_cycle_publications' then 'AFFILIATE_PUBLICATION' when 'affiliate_cycle_performance' then 'AFFILIATE_PERFORMANCE' when 'affiliate_revenue_candidates' then 'AFFILIATE_REVENUE_CANDIDATE' else 'AFFILIATE_REVENUE_EVIDENCE' end;
 ev:=case when tg_op='INSERT' then 'CREATED' when tg_table_name='affiliate_revenue_evidence' and to_jsonb(new)->>'verification_status'='VERIFIED' then 'VERIFIED' else 'UPDATED' end;
 st:=case tg_table_name when 'affiliate_cycle_publications' then to_jsonb(new)->>'execution_status' when 'affiliate_revenue_candidates' then to_jsonb(new)->>'status' when 'affiliate_revenue_evidence' then to_jsonb(new)->>'verification_status' else to_jsonb(new)->>'truth_class' end;
 k:=concat('m032:',lower(ot),':',x,':',lower(ev),':v',v);
 insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
 values(w,o,ot,x,ev,'OWNER',coalesce(auth.uid(),o)::text,'OWNER_STATED',jsonb_build_object('status',st,'version',v,'external_execution','LOCKED','paid_ai_jpy',0),k)
 on conflict(owner_user_id,idempotency_key) do nothing;
 insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary,metadata_sanitized)
 values(w,'owner',coalesce(auth.uid(),o)::text,concat('m032.',lower(tg_table_name),'.',lower(ev)),tg_table_name,x,k,jsonb_build_object('status',st,'version',v),jsonb_build_object('externalExecution','LOCKED','paidAiJpy',0));
 return new;
end $$;

create trigger affiliate_publication_audit after insert or update on public.affiliate_cycle_publications for each row execute function public.m032_audit_cycle_change();
create trigger affiliate_performance_audit after insert on public.affiliate_cycle_performance for each row execute function public.m032_audit_cycle_change();
create trigger affiliate_candidate_audit after insert or update on public.affiliate_revenue_candidates for each row execute function public.m032_audit_cycle_change();
create trigger affiliate_evidence_audit after insert or update on public.affiliate_revenue_evidence for each row execute function public.m032_audit_cycle_change();

do $$ declare t text; begin foreach t in array array['affiliate_cycle_publications','affiliate_cycle_performance','affiliate_revenue_candidates','affiliate_revenue_evidence'] loop execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);execute format('grant select,insert,update on public.%I to service_role',t);execute format('create policy %I on public.%I for select to authenticated using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace())',t||'_owner_read',t);end loop;end $$;

create function public.m032_owner_cycle_context(p_program uuid,p_content uuid,p_strategy uuid,p_research uuid default null) returns boolean
language sql stable security definer set search_path='' as $$ select auth.role()='authenticated' and auth.uid() is not null and exists(select 1 from public.affiliate_program_master p join public.personal_operational_records c on c.id=p_content and c.workspace_id=p.workspace_id and c.data_owner_id=auth.uid() and c.record_type='CONTENT' and c.payload->>'affiliate_program_id'=p.id::text left join public.affiliate_strategies s on s.id=p_strategy and s.workspace_id=p.workspace_id and s.owner_user_id=auth.uid() and s.affiliate_program_id=p.id and s.status='CONFIRMED' where p.id=p_program and p.workspace_id=public.resolve_personal_workspace() and (p_strategy is null or s.id is not null) and (p_research is null or s.source_research_id=p_research)); $$;

create function public.save_affiliate_cycle_publication(p_id uuid,p_expected_version bigint,p_program uuid,p_content uuid,p_strategy uuid,p_research uuid,p_platform text,p_external_url text,p_published_at timestamptz,p_status text,p_idempotency_key text)
returns table(object_id uuid,object_version bigint) language plpgsql security definer set search_path='' as $$ declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();x uuid;v bigint; begin
 if not public.m032_owner_cycle_context(p_program,p_content,p_strategy,p_research) or p_status not in('DRAFT','READY_FOR_REVIEW','APPROVED_FOR_MANUAL_EXECUTION','EXECUTED_EXTERNALLY','FAILED','ARCHIVED') then raise exception 'm032_publication_denied';end if;
 if p_status='EXECUTED_EXTERNALLY' and (p_external_url is null or p_published_at is null) then raise exception 'm032_manual_publication_required';end if;
 if p_id is null then insert into public.affiliate_cycle_publications(workspace_id,owner_user_id,affiliate_program_id,content_id,strategy_id,research_id,platform,external_url,published_at,execution_status,idempotency_key,provenance) values(w,a,p_program,p_content,p_strategy,p_research,left(btrim(p_platform),80),p_external_url,p_published_at,p_status,p_idempotency_key,jsonb_build_object('source','OWNER_ACTION','external_execution','LOCKED')) on conflict(owner_user_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id,version into x,v;
 else update public.affiliate_cycle_publications set platform=left(btrim(p_platform),80),external_url=p_external_url,published_at=p_published_at,execution_status=p_status,version=version+1,updated_at=clock_timestamp(),archived_at=case when p_status='ARCHIVED' then clock_timestamp() end where id=p_id and workspace_id=w and owner_user_id=a and version=p_expected_version returning id,version into x,v;if x is null then raise exception 'm032_stale_or_denied';end if;end if;return query select x,v; end $$;

create function public.record_affiliate_cycle_performance(p_publication uuid,p_expected_publication_version bigint,p_observed_at timestamptz,p_clicks bigint,p_conversions bigint,p_pending bigint,p_confirmed bigint,p_rejected bigint,p_currency text,p_source text,p_idempotency_key text)
returns table(performance_id uuid,performance_version bigint) language plpgsql security definer set search_path='' as $$ declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();p record;x uuid; begin
 select * into p from public.affiliate_cycle_publications where id=p_publication and workspace_id=w and owner_user_id=a and version=p_expected_publication_version and execution_status='EXECUTED_EXTERNALLY';if p.id is null then raise exception 'm032_executed_publication_required';end if;
 if p_conversions is null or p_conversions=0 then if p_pending is not null or p_confirmed is not null or p_rejected is not null then raise exception 'm032_reward_without_conversion';end if;end if;
 insert into public.affiliate_cycle_performance(workspace_id,owner_user_id,publication_id,affiliate_program_id,content_id,observed_at,clicks,conversions,pending_reward_minor,confirmed_reward_minor,rejected_reward_minor,currency,source,idempotency_key) values(w,a,p.id,p.affiliate_program_id,p.content_id,p_observed_at,p_clicks,p_conversions,p_pending,p_confirmed,p_rejected,p_currency,p_source,p_idempotency_key) on conflict(owner_user_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id,version into x;return query select x,1::bigint; end $$;

create function public.create_affiliate_revenue_candidate(p_performance uuid,p_status text,p_amount_minor bigint,p_currency text,p_reward_state text,p_source text,p_conversion_at timestamptz,p_confirmation_at timestamptz,p_provenance jsonb,p_idempotency_key text)
returns table(candidate_id uuid,candidate_version bigint) language plpgsql security definer set search_path='' as $$ declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();p record;u record;x uuid; begin
 select * into p from public.affiliate_cycle_performance where id=p_performance and workspace_id=w and owner_user_id=a and coalesce(conversions,0)>0; if p.id is null then raise exception 'm032_real_conversion_required';end if;select * into u from public.affiliate_cycle_publications where id=p.publication_id;
 if p_status not in('UNKNOWN','PENDING','CANDIDATE','REJECTED') or p_reward_state not in('UNKNOWN','PENDING','CONFIRMED','REJECTED') or jsonb_typeof(p_provenance)<>'object' then raise exception 'm032_candidate_invalid';end if;
 insert into public.affiliate_revenue_candidates(workspace_id,owner_user_id,affiliate_program_id,content_id,strategy_id,research_id,publication_id,performance_id,status,amount_minor,currency,reward_state,source,conversion_at,confirmation_at,provenance,idempotency_key) values(w,a,p.affiliate_program_id,p.content_id,u.strategy_id,u.research_id,u.id,p.id,p_status,p_amount_minor,p_currency,p_reward_state,p_source,p_conversion_at,p_confirmation_at,p_provenance,p_idempotency_key) on conflict(owner_user_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id,version into x;return query select x,1::bigint; end $$;

create function public.attach_affiliate_revenue_evidence(p_candidate uuid,p_expected_version bigint,p_type text,p_reference text,p_amount_minor bigint,p_currency text,p_occurred_at timestamptz,p_provenance jsonb,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$ declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();c record;x uuid;begin select * into c from public.affiliate_revenue_candidates where id=p_candidate and workspace_id=w and owner_user_id=a and version=p_expected_version and status in('PENDING','CANDIDATE');if c.id is null then raise exception 'm032_candidate_stale_or_denied';end if;if p_amount_minor<>c.amount_minor or p_currency<>c.currency or jsonb_typeof(p_provenance)<>'object' then raise exception 'm032_evidence_mismatch';end if;insert into public.affiliate_revenue_evidence(workspace_id,owner_user_id,candidate_id,performance_id,content_id,affiliate_program_id,evidence_type,source_reference,amount_minor,currency,occurred_at,provenance,idempotency_key) values(w,a,c.id,c.performance_id,c.content_id,c.affiliate_program_id,p_type,left(btrim(p_reference),500),p_amount_minor,p_currency,p_occurred_at,p_provenance,p_idempotency_key) on conflict(owner_user_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into x;update public.affiliate_revenue_candidates set evidence_status='ATTACHED',version=version+1,updated_at=clock_timestamp() where id=c.id;return x;end $$;

create function public.confirm_affiliate_actual_revenue(p_candidate uuid,p_expected_version bigint,p_evidence uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$ declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();c record;e record;r uuid;begin select * into c from public.affiliate_revenue_candidates where id=p_candidate and workspace_id=w and owner_user_id=a and version=p_expected_version and status='CANDIDATE' and reward_state='CONFIRMED';if c.id is null then raise exception 'm032_candidate_stale_or_unconfirmed';end if;select * into e from public.affiliate_revenue_evidence where id=p_evidence and candidate_id=c.id and workspace_id=w and owner_user_id=a and amount_minor=c.amount_minor and currency=c.currency and verification_status='UNVERIFIED';if e.id is null then raise exception 'm032_evidence_denied';end if;update public.affiliate_revenue_evidence set verification_status='VERIFIED',verified_by=a,verified_at=clock_timestamp() where id=e.id;insert into public.revenue_records(workspace_id,brand_id,client_id,campaign_id,evidence_candidate_id,lane,currency,gross_amount_minor,cost_amount_minor,net_amount_minor,recognized_at,attribution,verification_method,verified_by,affiliate_revenue_candidate_id,origin_type) values(w,null,null,null,null,'affiliate',c.currency,c.amount_minor,0,c.amount_minor,coalesce(c.confirmation_at,e.occurred_at),jsonb_build_object('affiliate_program_id',c.affiliate_program_id,'content_id',c.content_id,'publication_id',c.publication_id,'performance_id',c.performance_id,'evidence_id',e.id,'idempotency_key',p_idempotency_key),'M032_AFFILIATE_EVIDENCE',a,c.id,'AFFILIATE_PROGRAM') on conflict(affiliate_revenue_candidate_id) do nothing returning id into r;if r is null then select id into r from public.revenue_records where affiliate_revenue_candidate_id=c.id;end if;update public.affiliate_revenue_candidates set status='CONFIRMED_ACTUAL',evidence_status='VERIFIED',actual_revenue_record_id=r,version=version+1,updated_at=clock_timestamp() where id=c.id;return r;end $$;

create function public.enforce_m032_revenue_record_origin() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not exists(select 1 from public.account_personal_workspaces apw join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=apw.user_id and wm.status='active' where apw.user_id=auth.uid() and apw.workspace_id=new.workspace_id) then raise exception 'workspace_access_denied';end if;
 if new.origin_type='LEGACY_CAMPAIGN' then
  if new.brand_id is null or not exists(select 1 from public.brand_profiles b where b.id=new.brand_id and b.workspace_id=new.workspace_id) then raise exception 'brand_workspace_mismatch';end if;
  if new.client_id is not null and not exists(select 1 from public.clients c where c.id=new.client_id and c.workspace_id=new.workspace_id) then raise exception 'client_workspace_mismatch';end if;
  if new.evidence_candidate_id is null or not exists(select 1 from public.evidence_candidates e where e.id=new.evidence_candidate_id and e.workspace_id=new.workspace_id and e.campaign_id=new.campaign_id and e.verification_status='verified') then raise exception 'verified_evidence_required';end if;
 else
  if new.affiliate_revenue_candidate_id is null or not exists(select 1 from public.affiliate_revenue_candidates c join public.affiliate_revenue_evidence e on e.candidate_id=c.id and e.workspace_id=c.workspace_id and e.owner_user_id=c.owner_user_id and e.verification_status='VERIFIED' where c.id=new.affiliate_revenue_candidate_id and c.workspace_id=new.workspace_id and c.owner_user_id=auth.uid() and c.reward_state='CONFIRMED' and c.status='CANDIDATE' and c.evidence_status='ATTACHED' and e.amount_minor=new.gross_amount_minor and e.currency=new.currency) then raise exception 'm032_verified_affiliate_evidence_required';end if;
 end if;return new;end $$;
drop trigger revenue_records_workspace_integrity on public.revenue_records;
create trigger revenue_records_workspace_integrity before insert on public.revenue_records for each row execute function public.enforce_m032_revenue_record_origin();
create function public.enforce_m032_actual_revenue_snapshot() returns trigger language plpgsql security definer set search_path='' as $$ declare e public.evidence_candidates;v jsonb;begin
 if new.origin_type='AFFILIATE_PROGRAM' then
  if not exists(select 1 from public.affiliate_revenue_candidates c join public.affiliate_revenue_evidence x on x.candidate_id=c.id and x.verification_status='VERIFIED' where c.id=new.affiliate_revenue_candidate_id and x.amount_minor=new.gross_amount_minor and x.currency=new.currency) then raise exception 'm032_actual_snapshot_mismatch';end if;
 else
  select * into e from public.evidence_candidates where id=new.evidence_candidate_id;select preview_snapshot into v from public.approval_requests where id=(new.attribution->>'approvalRequestId')::uuid and workspace_id=new.workspace_id and campaign_id=new.campaign_id and scope='actual_revenue_verification' and status='approved';
  if e.id is null or v is null or v->>'evidenceCandidateId'<>new.evidence_candidate_id::text or (v->>'amountMinor')::bigint<>new.gross_amount_minor or (v->>'costAmountMinor')::bigint<>new.cost_amount_minor or v->>'currency'<>new.currency or e.amount_minor<>new.gross_amount_minor or e.cost_amount_minor<>new.cost_amount_minor or e.currency<>new.currency then raise exception 'actual_revenue_snapshot_mismatch';end if;
 end if;return new;end $$;
drop trigger revenue_records_approval_snapshot on public.revenue_records;
create trigger revenue_records_approval_snapshot before insert on public.revenue_records for each row execute function public.enforce_m032_actual_revenue_snapshot();

revoke all on function public.m032_owner_cycle_context(uuid,uuid,uuid,uuid),public.m032_audit_cycle_change(),public.enforce_m032_revenue_record_origin(),public.enforce_m032_actual_revenue_snapshot(),public.save_affiliate_cycle_publication(uuid,bigint,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text),public.record_affiliate_cycle_performance(uuid,bigint,timestamptz,bigint,bigint,bigint,bigint,bigint,text,text,text),public.create_affiliate_revenue_candidate(uuid,text,bigint,text,text,text,timestamptz,timestamptz,jsonb,text),public.attach_affiliate_revenue_evidence(uuid,bigint,text,text,bigint,text,timestamptz,jsonb,text),public.confirm_affiliate_actual_revenue(uuid,bigint,uuid,text) from public,anon;
grant execute on function public.save_affiliate_cycle_publication(uuid,bigint,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text),public.record_affiliate_cycle_performance(uuid,bigint,timestamptz,bigint,bigint,bigint,bigint,bigint,text,text,text),public.create_affiliate_revenue_candidate(uuid,text,bigint,text,text,text,timestamptz,timestamptz,jsonb,text),public.attach_affiliate_revenue_evidence(uuid,bigint,text,text,bigint,text,timestamptz,jsonb,text),public.confirm_affiliate_actual_revenue(uuid,bigint,uuid,text) to authenticated;

commit;
