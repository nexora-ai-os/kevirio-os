-- KEVIRIO M031: canonical Affiliate Strategy (additive; M001-M030 byte-stable)
begin;

do $$ begin
  if to_regclass('public.affiliate_program_master') is null
    or to_regclass('public.research_findings') is null
    or to_regclass('public.operational_object_links') is null
    or to_regclass('public.operational_activity_events') is null
    or to_regprocedure('public.resolve_personal_workspace()') is null
    or to_regprocedure('public.m028_safe_text(text,integer)') is null
    then raise exception 'm031_required_baseline_missing';
  end if;
  if to_regclass('public.affiliate_strategies') is not null
    or to_regprocedure('public.prepare_affiliate_strategy(uuid,uuid,uuid,jsonb,text)') is not null
    or to_regprocedure('public.review_affiliate_strategy(uuid,bigint,jsonb,text)') is not null
    or to_regprocedure('public.confirm_affiliate_strategy(uuid,bigint,text)') is not null
    or to_regprocedure('public.archive_affiliate_strategy(uuid,bigint,text)') is not null
    then raise exception 'm031_existing_or_partial_state';
  end if;
end $$;

create table public.affiliate_strategies(
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  affiliate_program_id uuid not null references public.affiliate_program_master(id) on delete restrict,
  source_research_id uuid not null,
  status text not null default 'GENERATED_DRAFT' check(status in('GENERATED_DRAFT','OWNER_REVIEW','CONFIRMED','ARCHIVED')),
  target_audience text,
  core_positioning text,
  value_proposition text,
  key_pain text,
  key_message text,
  recommended_angle text,
  recommended_channels text[] not null default '{}',
  content_direction text,
  risks text,
  next_action text,
  provenance jsonb not null check(jsonb_typeof(provenance)='object' and provenance<>'{}'::jsonb and length(provenance::text)<=12000),
  inference_metadata jsonb not null default '{"truth_class":"AI_INFERENCE","evidence_status":"NOT_EVIDENCE"}'::jsonb
    check(jsonb_typeof(inference_metadata)='object' and inference_metadata->>'truth_class' in('AI_INFERENCE','AI_RECOMMENDATION') and inference_metadata->>'evidence_status'='NOT_EVIDENCE'),
  version bigint not null default 1 check(version>0),
  idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'),
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  constraint affiliate_strategies_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  constraint affiliate_strategies_research_fk foreign key(source_research_id,workspace_id,owner_user_id)
    references public.research_findings(id,workspace_id,owner_user_id) on delete restrict,
  constraint affiliate_strategies_status_archive check((status='ARCHIVED')=(archived_at is not null)),
  constraint affiliate_strategies_text_sizes check(
    length(coalesce(target_audience,''))<=4000 and length(coalesce(core_positioning,''))<=4000
    and length(coalesce(value_proposition,''))<=4000 and length(coalesce(key_pain,''))<=4000
    and length(coalesce(key_message,''))<=4000 and length(coalesce(recommended_angle,''))<=4000
    and cardinality(recommended_channels)<=20 and length(coalesce(content_direction,''))<=8000
    and length(coalesce(risks,''))<=8000 and length(coalesce(next_action,''))<=4000),
  unique(owner_user_id,idempotency_key),
  unique(id,workspace_id,owner_user_id)
);

create index affiliate_strategies_program_status_idx on public.affiliate_strategies(owner_user_id,affiliate_program_id,status,updated_at desc);
create index affiliate_strategies_research_idx on public.affiliate_strategies(owner_user_id,source_research_id);
alter table public.affiliate_strategies enable row level security;
alter table public.affiliate_strategies force row level security;
create policy affiliate_strategies_owner_read on public.affiliate_strategies for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
revoke all on public.affiliate_strategies from public,anon,authenticated;
grant select on public.affiliate_strategies to authenticated;
grant select,insert,update on public.affiliate_strategies to service_role;

create function public.m031_strategy_payload(p jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare channels jsonb;
begin
  if jsonb_typeof(p)<>'object' or length(p::text)>40000 then raise exception 'm031_payload_invalid';end if;
  if exists(select 1 from jsonb_object_keys(p) x(key_name) where key_name not in('target_audience','core_positioning','value_proposition','key_pain','key_message','recommended_angle','recommended_channels','content_direction','risks','next_action','provenance','inference_metadata')) then raise exception 'm031_payload_field_denied';end if;
  if p::text~*'(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|password|private[_ -]?key|service[_ -]?role)' then raise exception 'm031_sensitive_data_denied';end if;
  channels:=coalesce(p->'recommended_channels','[]'::jsonb);
  if jsonb_typeof(channels)<>'array' or jsonb_array_length(channels)>20 then raise exception 'm031_channels_invalid';end if;
  return p;
end $$;

create function public.prepare_affiliate_strategy(p_owner_user_id uuid,p_program_id uuid,p_research_id uuid,p_payload jsonb,p_idempotency_key text)
returns table(strategy_id uuid,strategy_version bigint,strategy_status text)
language plpgsql security definer set search_path='' as $$
declare w uuid; s uuid; v bigint; payload jsonb:=public.m031_strategy_payload(p_payload); channels text[];
begin
  if auth.role()<>'service_role' then raise exception 'm031_service_role_required';end if;
  if p_idempotency_key is null or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'm031_idempotency_invalid';end if;
  select apw.workspace_id into w from public.account_personal_workspaces apw
  join public.workspaces ws on ws.id=apw.workspace_id and ws.status='active'
  join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=apw.user_id and wm.role='owner' and wm.status='active'
  join public.owner_profiles op on op.owner_id=apw.user_id and op.role='owner' and op.status='active'
  join public.user_account_states uas on uas.user_id=apw.user_id and uas.lifecycle_state='ACTIVE'
  where apw.user_id=p_owner_user_id;
  if w is null then raise exception 'm031_personal_owner_required';end if;
  if not exists(select 1 from public.affiliate_program_master p where p.id=p_program_id and p.workspace_id=w) then raise exception 'm031_program_denied';end if;
  if not exists(select 1 from public.research_findings r join public.operational_object_links l on l.workspace_id=w and l.owner_user_id=p_owner_user_id and l.from_type='GLOBAL_OPPORTUNITY' and l.from_id=r.id and l.to_type='AFFILIATE_PROGRAM' and l.to_id=p_program_id and l.relation_type='CREATED_FOR' where r.id=p_research_id and r.workspace_id=w and r.owner_user_id=p_owner_user_id and r.status='ACTIVE') then raise exception 'm031_research_link_denied';end if;
  select id,version into s,v from public.affiliate_strategies where owner_user_id=p_owner_user_id and idempotency_key=p_idempotency_key;
  if s is not null then return query select s,v,'GENERATED_DRAFT'::text;return;end if;
  select coalesce(array_agg(left(btrim(value),200) order by ord),'{}') into channels from jsonb_array_elements_text(coalesce(payload->'recommended_channels','[]')) with ordinality x(value,ord);
  insert into public.affiliate_strategies(workspace_id,owner_user_id,affiliate_program_id,source_research_id,target_audience,core_positioning,value_proposition,key_pain,key_message,recommended_angle,recommended_channels,content_direction,risks,next_action,provenance,inference_metadata,idempotency_key,audit_metadata)
  values(w,p_owner_user_id,p_program_id,p_research_id,nullif(left(btrim(payload->>'target_audience'),4000),''),nullif(left(btrim(payload->>'core_positioning'),4000),''),nullif(left(btrim(payload->>'value_proposition'),4000),''),nullif(left(btrim(payload->>'key_pain'),4000),''),nullif(left(btrim(payload->>'key_message'),4000),''),nullif(left(btrim(payload->>'recommended_angle'),4000),''),channels,nullif(left(btrim(payload->>'content_direction'),8000),''),nullif(left(btrim(payload->>'risks'),8000),''),nullif(left(btrim(payload->>'next_action'),4000),''),coalesce(payload->'provenance','{}'),coalesce(payload->'inference_metadata','{"truth_class":"AI_INFERENCE","evidence_status":"NOT_EVIDENCE"}'),p_idempotency_key,jsonb_build_object('paid_ai_jpy',0,'external_execution','LOCKED')) returning id,version into s,v;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(w,p_owner_user_id,'AFFILIATE_STRATEGY',s,'GENERATED_DRAFT','AI_RUNTIME','gemini-free','AI_INFERENCE',jsonb_build_object('program_id',p_program_id,'research_id',p_research_id,'paid_ai_jpy',0,'external_execution','LOCKED'),p_idempotency_key||':event');
  return query select s,v,'GENERATED_DRAFT'::text;
end $$;

create function public.review_affiliate_strategy(p_strategy_id uuid,p_expected_version bigint,p_payload jsonb,p_idempotency_key text)
returns table(strategy_id uuid,strategy_version bigint,strategy_status text)
language plpgsql security definer set search_path='' as $$
declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();v bigint;payload jsonb:=public.m031_strategy_payload(p_payload);channels text[];
begin
 if auth.role()<>'authenticated' or a is null or w is null then raise exception 'm031_owner_authentication_required';end if;
 select coalesce(array_agg(left(btrim(value),200) order by ord),'{}') into channels from jsonb_array_elements_text(coalesce(payload->'recommended_channels','[]')) with ordinality x(value,ord);
 update public.affiliate_strategies set target_audience=nullif(left(btrim(payload->>'target_audience'),4000),''),core_positioning=nullif(left(btrim(payload->>'core_positioning'),4000),''),value_proposition=nullif(left(btrim(payload->>'value_proposition'),4000),''),key_pain=nullif(left(btrim(payload->>'key_pain'),4000),''),key_message=nullif(left(btrim(payload->>'key_message'),4000),''),recommended_angle=nullif(left(btrim(payload->>'recommended_angle'),4000),''),recommended_channels=channels,content_direction=nullif(left(btrim(payload->>'content_direction'),8000),''),risks=nullif(left(btrim(payload->>'risks'),8000),''),next_action=nullif(left(btrim(payload->>'next_action'),4000),''),status='OWNER_REVIEW',version=version+1,updated_at=clock_timestamp()
 where id=p_strategy_id and owner_user_id=a and workspace_id=w and version=p_expected_version and status in('GENERATED_DRAFT','OWNER_REVIEW') returning version into v;
 if v is null then raise exception 'm031_stale_or_denied';end if;
 return query select p_strategy_id,v,'OWNER_REVIEW'::text;
end $$;

create function public.confirm_affiliate_strategy(p_strategy_id uuid,p_expected_version bigint,p_idempotency_key text)
returns table(strategy_id uuid,strategy_version bigint,strategy_status text)
language plpgsql security definer set search_path='' as $$
declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();v bigint;
begin
 if auth.role()<>'authenticated' or a is null or w is null then raise exception 'm031_owner_authentication_required';end if;
 update public.affiliate_strategies set status='CONFIRMED',version=version+1,updated_at=clock_timestamp(),audit_metadata=audit_metadata||jsonb_build_object('owner_confirmed_at',clock_timestamp()) where id=p_strategy_id and owner_user_id=a and workspace_id=w and version=p_expected_version and status='OWNER_REVIEW' returning version into v;
 if v is null then raise exception 'm031_stale_or_invalid_transition';end if;
 return query select p_strategy_id,v,'CONFIRMED'::text;
end $$;

create function public.archive_affiliate_strategy(p_strategy_id uuid,p_expected_version bigint,p_idempotency_key text)
returns bigint language plpgsql security definer set search_path='' as $$
declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();v bigint;
begin
 if auth.role()<>'authenticated' or a is null or w is null then raise exception 'm031_owner_authentication_required';end if;
 update public.affiliate_strategies set status='ARCHIVED',archived_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp() where id=p_strategy_id and owner_user_id=a and workspace_id=w and version=p_expected_version and status<>'ARCHIVED' returning version into v;
 if v is null then raise exception 'm031_stale_or_denied';end if;return v;
end $$;

revoke all on function public.m031_strategy_payload(jsonb),public.prepare_affiliate_strategy(uuid,uuid,uuid,jsonb,text),public.review_affiliate_strategy(uuid,bigint,jsonb,text),public.confirm_affiliate_strategy(uuid,bigint,text),public.archive_affiliate_strategy(uuid,bigint,text) from public,anon;
grant execute on function public.prepare_affiliate_strategy(uuid,uuid,uuid,jsonb,text) to service_role;
grant execute on function public.review_affiliate_strategy(uuid,bigint,jsonb,text),public.confirm_affiliate_strategy(uuid,bigint,text),public.archive_affiliate_strategy(uuid,bigint,text) to authenticated;
alter function public.m031_strategy_payload(jsonb) owner to postgres;
alter function public.prepare_affiliate_strategy(uuid,uuid,uuid,jsonb,text) owner to postgres;
alter function public.review_affiliate_strategy(uuid,bigint,jsonb,text) owner to postgres;
alter function public.confirm_affiliate_strategy(uuid,bigint,text) owner to postgres;
alter function public.archive_affiliate_strategy(uuid,bigint,text) owner to postgres;
commit;
