begin;
do $test$
declare a uuid:='29000000-0000-4000-8000-0000000000a1';w uuid:='29000000-0000-4000-8000-0000000000a2';b uuid:='30000000-0000-4000-8000-0000000000b1';wb uuid:='30000000-0000-4000-8000-0000000000b2';p uuid:='30000000-0000-4000-8000-000000000001';d uuid:='30000000-0000-4000-8000-000000000002';q uuid:='30000000-0000-4000-8000-000000000003';z uuid:='30000000-0000-4000-8000-000000000004';f uuid:='30000000-0000-4000-8000-000000000005';u timestamptz;v bigint;r record;before_hash text;after_hash text;
begin
 select apw.user_id,apw.workspace_id into a,w
 from public.account_personal_workspaces apw
 join public.workspaces ws on ws.id=apw.workspace_id and ws.status='active'
 join public.workspace_members wm on wm.workspace_id=apw.workspace_id and wm.user_id=apw.user_id and wm.role='owner' and wm.status='active'
 join public.owner_profiles op on op.owner_id=apw.user_id and op.role='owner' and op.status='active'
 order by apw.user_id limit 1;
 if a is null or w is null then raise exception 'm030_personal_workspace_owner_required';end if;
 insert into public.user_account_states(user_id,lifecycle_state,activated_at) values(a,'ACTIVE',clock_timestamp()) on conflict(user_id) do update set lifecycle_state='ACTIVE';
 insert into auth.users(id) values(b) on conflict(id) do nothing;
 insert into public.owner_profiles(owner_id,role,status) values(b,'owner','active') on conflict(owner_id) do update set status='active';
 insert into public.workspaces(id,owner_id,slug,name,status) values(wb,b,'m030-owner-b','M030 Owner B','active') on conflict(id) do nothing;
 insert into public.workspace_members(workspace_id,user_id,role,status) values(wb,b,'owner','active') on conflict(workspace_id,user_id) do nothing;
 insert into public.account_personal_workspaces(user_id,workspace_id) values(b,wb) on conflict(user_id) do update set workspace_id=excluded.workspace_id;
 insert into public.user_account_states(user_id,lifecycle_state,activated_at) values(b,'ACTIVE',clock_timestamp()) on conflict(user_id) do update set lifecycle_state='ACTIVE';
 perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',a::text,true);
 insert into public.affiliate_program_master(id,workspace_id,asp_name,program_id,advertiser_name,program_name,reward_type,listing_policy,listing_ng_words_verification_status,program_status,affiliate_link_status,source_type,external_execution_allowed,created_by)
 values(p,w,'M030_TEST','M030-UPDATE','M030 Advertiser','M030 update fixture','UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN','NOT_REGISTERED','OWNER_MANUAL',false,a),
 (d,w,'M030_TEST','M030-DELETE','M030 Advertiser','M030 delete fixture','UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN','NOT_REGISTERED','OWNER_MANUAL',false,a),
 (q,w,'M030_TEST','M030-PROTECTED','M030 Advertiser','M030 protected fixture','UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN','NOT_REGISTERED','OWNER_MANUAL',false,a),
 (z,w,'M030_TEST','M030-ARCHIVED','M030 Advertiser','M030 archived fixture','UNKNOWN','UNKNOWN','UNKNOWN','ARCHIVED','NOT_REGISTERED','OWNER_MANUAL',false,a),
 (f,w,'M030_TEST','M030-FAIL','M030 Advertiser','M030 forced failure fixture','UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN','NOT_REGISTERED','OWNER_MANUAL',false,a);
 select updated_at,business_version into u,v from public.affiliate_program_master where id=p;
 select * into r from public.update_affiliate_program_master_practical(p,u,v,jsonb_build_object('reward_type','TIERED','reward_details',jsonb_build_object('tiers',2),'epc',5.25,'approval_rate',82.5,'revisit_window_days',90,'confirmation_days',30,'pr_points','Primary benefit','listing_policy','PARTIAL','listing_ng_words',jsonb_build_array('誇大表現','最安保証'),'listing_ng_words_raw','公式掲載条件を確認','listing_ng_words_verification_status','CONFIRMED','source_type','ASP_DASHBOARD','source_verified_at',clock_timestamp()));
 if r.business_version<>v+1 or not exists(select 1 from public.affiliate_program_master where id=p and reward_type='TIERED' and epc=5.25 and approval_rate=82.5 and listing_ng_words=array['誇大表現','最安保証']) then raise exception 'm030_update_persistence_failed';end if;
 select encode(extensions.digest(to_jsonb(x)::text,'sha256'),'hex') into before_hash from public.affiliate_program_master x where id=p;
 execute 'create function pg_temp.fail_m030_audit() returns trigger language plpgsql as $f$begin if new.event_type=''affiliate_program_practical_updated'' then raise exception ''forced_m030_audit_failure'';end if;return new;end$f$';
 execute 'create trigger m030_force_audit_failure before insert on public.company_operating_events for each row execute function pg_temp.fail_m030_audit()';
 begin perform public.update_affiliate_program_master_practical(p,r.updated_at,r.business_version,'{"reward_summary":"must rollback"}');raise exception 'm030_audit_failure_not_raised';exception when others then if sqlerrm not like '%forced_m030_audit_failure%' then raise;end if;end;
 execute 'drop trigger m030_force_audit_failure on public.company_operating_events';
 select encode(extensions.digest(to_jsonb(x)::text,'sha256'),'hex') into after_hash from public.affiliate_program_master x where id=p;
 if before_hash<>after_hash then raise exception 'm030_audit_atomicity_failed';end if;
 begin perform public.update_affiliate_program_master_practical(p,u,v,'{"reward_type":"FIXED"}');raise exception 'm030_stale_update_not_denied';exception when others then if sqlerrm not like '%m030_stale_update%' then raise;end if;end;
 begin perform public.update_affiliate_program_master_practical(p,r.updated_at,r.business_version,'{"approval_rate":101}');raise exception 'm030_invalid_rate_not_denied';exception when others then if sqlerrm not like '%m030_approval_rate_invalid%' then raise;end if;end;
 begin perform public.update_affiliate_program_master_practical(p,r.updated_at,r.business_version,'{"listing_ng_words_verification_status":"NOT_CONFIRMED","listing_ng_words":["x"]}');raise exception 'm030_ng_truth_not_denied';exception when others then if sqlerrm not like '%m030_ng_truth_conflict%' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',b::text,true);
 begin perform public.update_affiliate_program_master_practical(p,r.updated_at,r.business_version,'{"reward_type":"FIXED"}');raise exception 'm030_cross_user_not_denied';exception when others then if sqlerrm not like '%m030_program_not_found%' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',a::text,true);
 insert into public.operational_object_links(workspace_id,owner_user_id,from_type,from_id,to_type,to_id,relation_type,provenance) values(w,a,'AFFILIATE_PROGRAM',q,'CONTENT',extensions.gen_random_uuid(),'RELATES_TO','{"fixture":"M030"}');
 select * into r from public.delete_affiliate_program_master_if_safe(q,(select updated_at from public.affiliate_program_master where id=q),(select business_version from public.affiliate_program_master where id=q),'m030:delete:protected');
 if r.classification not in('ARCHIVE_ONLY','PROTECTED_HISTORY') or r.deleted then raise exception 'm030_protected_delete_not_denied';end if;
 select * into r from public.delete_affiliate_program_master_if_safe(z,(select updated_at from public.affiliate_program_master where id=z),(select business_version from public.affiliate_program_master where id=z),'m030:delete:archived');
 if r.classification<>'ARCHIVE_ONLY' or r.deleted or not(r.reason_codes?'PROGRAM_ARCHIVED') then raise exception 'm030_archived_delete_not_denied';end if;
 begin perform public.delete_affiliate_program_master_if_safe('30000000-0000-4000-8000-ffffffffffff',clock_timestamp(),1,'m030:delete:not-found');raise exception 'm030_missing_delete_not_denied';exception when others then if sqlerrm not like '%m030_program_not_found%' then raise;end if;end;
 execute 'create function pg_temp.fail_m030_delete_audit() returns trigger language plpgsql as $f$begin if new.event_type=''DELETED'' then raise exception ''forced_m030_delete_audit_failure'';end if;return new;end$f$';
 execute 'create trigger m030_force_delete_audit_failure before insert on public.operational_activity_events for each row execute function pg_temp.fail_m030_delete_audit()';
 begin perform public.delete_affiliate_program_master_if_safe(f,(select updated_at from public.affiliate_program_master where id=f),(select business_version from public.affiliate_program_master where id=f),'m030:delete:audit-fail');raise exception 'm030_delete_audit_failure_not_raised';exception when others then if sqlerrm not like '%forced_m030_delete_audit_failure%' then raise;end if;end;
 execute 'drop trigger m030_force_delete_audit_failure on public.operational_activity_events';
 if not exists(select 1 from public.affiliate_program_master where id=f) then raise exception 'm030_delete_audit_atomicity_failed';end if;
 select * into r from public.delete_affiliate_program_master_if_safe(d,(select updated_at from public.affiliate_program_master where id=d),(select business_version from public.affiliate_program_master where id=d),'m030:delete:safe');
 if r.classification<>'SAFE_TO_DELETE' or not r.deleted or exists(select 1 from public.affiliate_program_master where id=d) then raise exception 'm030_safe_delete_failed';end if;
 select * into r from public.delete_affiliate_program_master_if_safe(d,clock_timestamp(),1,'m030:delete:safe');
 if r.classification<>'SAFE_TO_DELETE' or r.deleted or not(r.reason_codes?'ALREADY_DELETED') then raise exception 'm030_delete_idempotency_failed';end if;
 if not exists(select 1 from public.company_operating_events where entity_id=d and event_type='affiliate_program_safely_deleted') or not exists(select 1 from public.operational_activity_events where object_id=d and event_type='DELETED') then raise exception 'm030_tombstone_missing';end if;
 if exists(select 1 from information_schema.role_table_grants where table_schema='public' and table_name='affiliate_program_master' and grantee in('anon','authenticated') and privilege_type in('INSERT','UPDATE','DELETE')) then raise exception 'm030_browser_dml_exposed';end if;
end;$test$;
select jsonb_build_object('result','M030_EXECUTABLE_SECURITY_CONCURRENCY_PASS','transaction_rolled_back',true,'paid_ai_jpy',0,'external_execution','LOCKED') verification;
rollback;
