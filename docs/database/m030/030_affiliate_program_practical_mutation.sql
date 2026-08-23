begin;

do $$ begin
  if to_regclass('public.affiliate_program_master') is null
    or to_regclass('public.company_operating_events') is null
    or to_regclass('public.operational_object_links') is null
    or to_regclass('public.operational_activity_events') is null
    or to_regclass('public.canonical_domain_conversions') is null
    or to_regclass('public.internal_action_records') is null then
    raise exception 'm030_required_baseline_missing';
  end if;
  if to_regprocedure('public.update_affiliate_program_master_practical(uuid,timestamp with time zone,bigint,jsonb)') is not null
    or to_regprocedure('public.delete_affiliate_program_master_if_safe(uuid,timestamp with time zone,bigint,text)') is not null then
    raise exception 'm030_existing_or_partial_state';
  end if;
end $$;

create function public.update_affiliate_program_master_practical(
  p_program_id uuid,p_expected_updated_at timestamptz,p_expected_business_version bigint,p_changes jsonb
) returns table(program_id uuid,updated_at timestamptz,business_version bigint)
language plpgsql security definer set search_path='' as $m030_update$
declare
  a uuid:=auth.uid(); w uuid:=public.resolve_personal_workspace(); c public.affiliate_program_master%rowtype;
  changed jsonb; new_id uuid; new_updated timestamptz; new_version bigint;
  ng text[]; verification text; reward_type_v text; listing_policy_v text; source_type_v text;
begin
  if auth.role()<>'authenticated' or a is null or w is null then raise exception 'm030_owner_authentication_required';end if;
  if not exists(select 1 from public.account_personal_workspaces x where x.user_id=a and x.workspace_id=w)
    or not public.is_canonical_personal_workspace_owner(w) then raise exception 'm030_personal_owner_required';end if;
  if p_program_id is null or p_expected_updated_at is null or p_expected_business_version is null
    or jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb or length(p_changes::text)>50000 then raise exception 'm030_update_invalid';end if;
  if p_changes::text~*'(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|password|private[_ -]?key)' then raise exception 'm030_sensitive_data_denied';end if;
  if exists(select 1 from jsonb_object_keys(p_changes) k where k not in(
    'asp_name','program_id','advertiser_name','program_name','category','reward_type','reward_summary','reward_details',
    'epc','approval_rate','revisit_window_days','confirmation_days','conversion_conditions','rejection_conditions','pr_points',
    'listing_policy','listing_ng_words','listing_ng_words_raw','listing_ng_words_verification_status','compliance_notes',
    'source_type','source_verified_at','source_notes','owner_notes'
  )) then raise exception 'm030_field_not_allowlisted';end if;
  select * into c from public.affiliate_program_master x where x.id=p_program_id and x.workspace_id=w for update;
  if not found then raise exception 'm030_program_not_found';end if;
  if c.updated_at is distinct from p_expected_updated_at or c.business_version<>p_expected_business_version then raise exception 'm030_stale_update';end if;

  reward_type_v:=case when p_changes?'reward_type' then upper(p_changes->>'reward_type') else c.reward_type end;
  listing_policy_v:=case when p_changes?'listing_policy' then upper(p_changes->>'listing_policy') else c.listing_policy end;
  verification:=case when p_changes?'listing_ng_words_verification_status' then upper(p_changes->>'listing_ng_words_verification_status') else c.listing_ng_words_verification_status end;
  source_type_v:=case when p_changes?'source_type' then upper(btrim(p_changes->>'source_type')) else c.source_type end;
  if reward_type_v not in('FIXED','PERCENTAGE','TIERED','OTHER','UNKNOWN') then raise exception 'm030_reward_type_invalid';end if;
  if listing_policy_v not in('OK','PARTIAL','NG','UNKNOWN') then raise exception 'm030_listing_policy_invalid';end if;
  if verification not in('UNKNOWN','NOT_CONFIRMED','NONE_CONFIRMED','CONFIRMED') then raise exception 'm030_listing_verification_invalid';end if;
  if source_type_v!~'^[A-Z][A-Z0-9_]{1,79}$' then raise exception 'm030_source_type_invalid';end if;
  if p_changes?'reward_details' and p_changes->'reward_details'<>'null'::jsonb and jsonb_typeof(p_changes->'reward_details')<>'object' then raise exception 'm030_reward_details_invalid';end if;
  if p_changes?'epc' and p_changes->'epc'<>'null'::jsonb and (jsonb_typeof(p_changes->'epc')<>'number' or (p_changes->>'epc')::numeric<0) then raise exception 'm030_epc_invalid';end if;
  if p_changes?'approval_rate' and p_changes->'approval_rate'<>'null'::jsonb and (jsonb_typeof(p_changes->'approval_rate')<>'number' or (p_changes->>'approval_rate')::numeric not between 0 and 100) then raise exception 'm030_approval_rate_invalid';end if;
  if p_changes?'revisit_window_days' and p_changes->'revisit_window_days'<>'null'::jsonb and (jsonb_typeof(p_changes->'revisit_window_days')<>'number' or (p_changes->>'revisit_window_days')::numeric<>trunc((p_changes->>'revisit_window_days')::numeric) or (p_changes->>'revisit_window_days')::integer<0) then raise exception 'm030_revisit_invalid';end if;
  if p_changes?'confirmation_days' and p_changes->'confirmation_days'<>'null'::jsonb and (jsonb_typeof(p_changes->'confirmation_days')<>'number' or (p_changes->>'confirmation_days')::numeric<>trunc((p_changes->>'confirmation_days')::numeric) or (p_changes->>'confirmation_days')::integer<0) then raise exception 'm030_confirmation_invalid';end if;
  if p_changes?'listing_ng_words' then
    if p_changes->'listing_ng_words'='null'::jsonb then ng:=null;
    elsif jsonb_typeof(p_changes->'listing_ng_words')<>'array' or jsonb_array_length(p_changes->'listing_ng_words')>100 then raise exception 'm030_ng_words_invalid';
    else select array_agg(btrim(value) order by ord) into ng from jsonb_array_elements_text(p_changes->'listing_ng_words') with ordinality x(value,ord);
      if exists(select 1 from unnest(ng) x where length(x) not between 1 and 200) then raise exception 'm030_ng_word_invalid';end if;
    end if;
  else ng:=c.listing_ng_words;end if;
  if verification='NOT_CONFIRMED' and ng is not null then raise exception 'm030_ng_truth_conflict';end if;
  if verification='NONE_CONFIRMED' and coalesce(cardinality(ng),0)<>0 then raise exception 'm030_ng_none_conflict';end if;
  if verification='CONFIRMED' and ng is null then raise exception 'm030_ng_confirmed_requires_array';end if;
  if length(coalesce(p_changes->>'asp_name',c.asp_name)) not between 1 and 120
    or length(coalesce(p_changes->>'program_id',c.program_id)) not between 1 and 120
    or length(coalesce(p_changes->>'advertiser_name',c.advertiser_name)) not between 1 and 200
    or length(coalesce(p_changes->>'program_name',c.program_name)) not between 1 and 500
    or length(coalesce(p_changes->>'category',c.category,''))>200
    or length(coalesce(p_changes->>'reward_summary',c.reward_summary,''))>4000
    or length(coalesce(p_changes->>'conversion_conditions',c.conversion_conditions,''))>10000
    or length(coalesce(p_changes->>'rejection_conditions',c.rejection_conditions,''))>10000
    or length(coalesce(p_changes->>'pr_points',c.pr_points,''))>10000
    or length(coalesce(p_changes->>'listing_ng_words_raw',c.listing_ng_words_raw,''))>20000
    or length(coalesce(p_changes->>'compliance_notes',c.compliance_notes,''))>10000
    or length(coalesce(p_changes->>'source_notes',c.source_notes,''))>10000
    or length(coalesce(p_changes->>'owner_notes',c.owner_notes,''))>10000 then raise exception 'm030_text_validation_failed';end if;

  update public.affiliate_program_master x set
    asp_name=case when p_changes?'asp_name' then btrim(p_changes->>'asp_name') else x.asp_name end,
    program_id=case when p_changes?'program_id' then btrim(p_changes->>'program_id') else x.program_id end,
    advertiser_name=case when p_changes?'advertiser_name' then btrim(p_changes->>'advertiser_name') else x.advertiser_name end,
    program_name=case when p_changes?'program_name' then btrim(p_changes->>'program_name') else x.program_name end,
    category=case when p_changes?'category' then nullif(btrim(p_changes->>'category'),'') else x.category end,
    reward_type=reward_type_v,reward_summary=case when p_changes?'reward_summary' then nullif(btrim(p_changes->>'reward_summary'),'') else x.reward_summary end,
    reward_details=case when p_changes?'reward_details' then nullif(p_changes->'reward_details','null'::jsonb) else x.reward_details end,
    epc=case when p_changes?'epc' then nullif(p_changes->>'epc','')::numeric else x.epc end,
    approval_rate=case when p_changes?'approval_rate' then nullif(p_changes->>'approval_rate','')::numeric else x.approval_rate end,
    revisit_window_days=case when p_changes?'revisit_window_days' then nullif(p_changes->>'revisit_window_days','')::integer else x.revisit_window_days end,
    confirmation_days=case when p_changes?'confirmation_days' then nullif(p_changes->>'confirmation_days','')::integer else x.confirmation_days end,
    conversion_conditions=case when p_changes?'conversion_conditions' then nullif(btrim(p_changes->>'conversion_conditions'),'') else x.conversion_conditions end,
    rejection_conditions=case when p_changes?'rejection_conditions' then nullif(btrim(p_changes->>'rejection_conditions'),'') else x.rejection_conditions end,
    pr_points=case when p_changes?'pr_points' then nullif(btrim(p_changes->>'pr_points'),'') else x.pr_points end,
    listing_policy=listing_policy_v,listing_ng_words=ng,
    listing_ng_words_raw=case when p_changes?'listing_ng_words_raw' then nullif(btrim(p_changes->>'listing_ng_words_raw'),'') else x.listing_ng_words_raw end,
    listing_ng_words_verification_status=verification,
    compliance_notes=case when p_changes?'compliance_notes' then nullif(btrim(p_changes->>'compliance_notes'),'') else x.compliance_notes end,
    source_type=source_type_v,source_verified_at=case when p_changes?'source_verified_at' then nullif(p_changes->>'source_verified_at','')::timestamptz else x.source_verified_at end,
    source_notes=case when p_changes?'source_notes' then nullif(btrim(p_changes->>'source_notes'),'') else x.source_notes end,
    owner_notes=case when p_changes?'owner_notes' then nullif(btrim(p_changes->>'owner_notes'),'') else x.owner_notes end,
    business_version=x.business_version+1
  where x.id=p_program_id and x.workspace_id=w and x.updated_at=p_expected_updated_at and x.business_version=p_expected_business_version
  returning x.id,x.updated_at,x.business_version into new_id,new_updated,new_version;
  if new_id is null then raise exception 'm030_stale_update';end if;
  select coalesce(jsonb_agg(k order by k),'[]') into changed from jsonb_object_keys(p_changes) k;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(w,'affiliate_program_master',new_id,'affiliate_program_practical_updated','owner',a::text,jsonb_build_object('changed_fields',changed,'business_version',new_version,'paid_ai_jpy',0,'external_execution','LOCKED'));
  return query select new_id,new_updated,new_version;
end;$m030_update$;

create function public.delete_affiliate_program_master_if_safe(
 p_program_id uuid,p_expected_updated_at timestamptz,p_expected_business_version bigint,p_idempotency_key text
) returns table(classification text,deleted boolean,reason_codes jsonb)
language plpgsql security definer set search_path='' as $m030_delete$
declare a uuid:=auth.uid();w uuid:=public.resolve_personal_workspace();c public.affiliate_program_master%rowtype; reasons jsonb:='[]'; canonical_ids uuid[]; protected_count bigint:=0;
begin
 if auth.role()<>'authenticated' or a is null or w is null then raise exception 'm030_owner_authentication_required';end if;
 if p_idempotency_key is null or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'm030_delete_idempotency_invalid';end if;
 if exists(select 1 from public.operational_activity_events e where e.owner_user_id=a and e.idempotency_key=p_idempotency_key and e.event_type='DELETED') then return query select 'SAFE_TO_DELETE'::text,false,jsonb_build_array('ALREADY_DELETED');return;end if;
 select * into c from public.affiliate_program_master x where x.id=p_program_id and x.workspace_id=w for update;
 if not found then raise exception 'm030_program_not_found';end if;
 if c.updated_at is distinct from p_expected_updated_at or c.business_version<>p_expected_business_version then raise exception 'm030_stale_delete';end if;
 if c.program_status='ARCHIVED' then reasons:=reasons||'"PROGRAM_ARCHIVED"'::jsonb;end if;
 select array_agg(id) into canonical_ids from public.affiliate_programs x where x.workspace_id=w and x.asp_name=c.asp_name and coalesce(x.program_code,'')=c.program_id;
 if coalesce(cardinality(canonical_ids),0)>0 then reasons:=reasons||'"CANONICAL_AFFILIATE_PROGRAM"'::jsonb;end if;
 if exists(select 1 from public.operational_object_links l where l.workspace_id=w and ((l.from_type='AFFILIATE_PROGRAM' and l.from_id=c.id) or(l.to_type='AFFILIATE_PROGRAM' and l.to_id=c.id))) then reasons:=reasons||'"OPERATIONAL_LINK"'::jsonb;end if;
 if exists(select 1 from public.canonical_domain_conversions x where x.workspace_id=w and ((x.source_type='AFFILIATE_PROGRAM' and x.source_id=c.id) or(x.target_type='AFFILIATE_PROGRAM' and x.target_id=c.id))) then reasons:=reasons||'"CANONICAL_CONVERSION"'::jsonb;end if;
 if exists(select 1 from public.internal_action_records x where x.workspace_id=w and x.target_type='AFFILIATE_PROGRAM' and x.target_id=c.id) then reasons:=reasons||'"INTERNAL_ACTION"'::jsonb;end if;
 if exists(select 1 from public.operational_activity_events x where x.workspace_id=w and x.object_type='AFFILIATE_PROGRAM' and x.object_id=c.id and x.event_type in('CONVERTED','LINKED','INTERNAL_ACTION_PREPARED','COMPLETED','PUBLISHED','ACTUAL_RECORDED','EVIDENCE_VERIFIED')) then reasons:=reasons||'"PROTECTED_TIMELINE"'::jsonb;end if;
 if canonical_ids is not null and exists(select 1 from public.affiliate_publications x where x.workspace_id=w and x.affiliate_program_id=any(canonical_ids)) then reasons:=reasons||'"PUBLICATION_HISTORY"'::jsonb;end if;
 if canonical_ids is not null and exists(select 1 from public.affiliate_performance_records x where x.workspace_id=w and x.affiliate_program_id=any(canonical_ids)) then reasons:=reasons||'"PERFORMANCE_HISTORY"'::jsonb;end if;
 protected_count:=jsonb_array_length(reasons);
 if protected_count>0 then return query select case when reasons ? 'PROTECTED_TIMELINE' or reasons ? 'PUBLICATION_HISTORY' or reasons ? 'PERFORMANCE_HISTORY' or reasons ? 'CANONICAL_CONVERSION' then 'PROTECTED_HISTORY' else 'ARCHIVE_ONLY' end,false,reasons;return;end if;
 delete from public.affiliate_program_master x where x.id=c.id and x.workspace_id=w;
 if not found then raise exception 'm030_delete_race_denied';end if;
 insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
 values(w,a,'AFFILIATE_PROGRAM',c.id,'DELETED','OWNER',a::text,'SYSTEM_METADATA',jsonb_build_object('asp_name',left(c.asp_name,120),'program_id',left(c.program_id,120),'program_name',left(c.program_name,240),'dependency_count',0,'reason','OWNER_APPROVED_DISPOSABLE_CLEANUP','paid_ai_jpy',0,'external_execution','LOCKED'),p_idempotency_key);
 insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
 values(w,'affiliate_program_master',c.id,'affiliate_program_safely_deleted','owner',a::text,jsonb_build_object('dependency_count',0,'reason','OWNER_APPROVED_DISPOSABLE_CLEANUP','paid_ai_jpy',0,'external_execution','LOCKED'));
 return query select 'SAFE_TO_DELETE',true,'[]'::jsonb;
end;$m030_delete$;

revoke all on function public.update_affiliate_program_master_practical(uuid,timestamptz,bigint,jsonb) from public,anon;
revoke all on function public.delete_affiliate_program_master_if_safe(uuid,timestamptz,bigint,text) from public,anon;
grant execute on function public.update_affiliate_program_master_practical(uuid,timestamptz,bigint,jsonb) to authenticated;
grant execute on function public.delete_affiliate_program_master_if_safe(uuid,timestamptz,bigint,text) to authenticated;
alter function public.update_affiliate_program_master_practical(uuid,timestamptz,bigint,jsonb) owner to postgres;
alter function public.delete_affiliate_program_master_if_safe(uuid,timestamptz,bigint,text) owner to postgres;
revoke insert,update,delete on public.affiliate_program_master from authenticated,anon;

commit;
