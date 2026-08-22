begin;
insert into auth.users(id) values('29000000-0000-4000-8000-000000000001'),('29000000-0000-4000-8000-000000000002') on conflict(id) do nothing;
insert into public.workspaces(id,owner_id,slug,name,status) values
 ('29000000-0000-4000-8000-000000000011','29000000-0000-4000-8000-000000000001','m029-fixture-a','M029 A','active'),
 ('29000000-0000-4000-8000-000000000012','29000000-0000-4000-8000-000000000002','m029-fixture-b','M029 B','active') on conflict(id) do nothing;
insert into public.workspace_members(workspace_id,user_id,role,status) values
 ('29000000-0000-4000-8000-000000000011','29000000-0000-4000-8000-000000000001','owner','active'),
 ('29000000-0000-4000-8000-000000000012','29000000-0000-4000-8000-000000000002','owner','active') on conflict(workspace_id,user_id) do nothing;
insert into public.account_personal_workspaces(user_id,workspace_id) values
 ('29000000-0000-4000-8000-000000000001','29000000-0000-4000-8000-000000000011'),
 ('29000000-0000-4000-8000-000000000002','29000000-0000-4000-8000-000000000012') on conflict(user_id) do nothing;
do $$
declare a uuid;b uuid;wa uuid;wb uuid;r uuid;q uuid;c uuid;c2 uuid;v bigint;v2 bigint;r2 uuid;dv bigint;link_id uuid;denied boolean;
begin
  select user_id,workspace_id into a,wa from public.account_personal_workspaces where user_id='29000000-0000-4000-8000-000000000001';
  select user_id,workspace_id into b,wb from public.account_personal_workspaces where user_id='29000000-0000-4000-8000-000000000002';
  if a is null or b is null or wa=wb then raise exception 'm029_two_isolated_personal_users_required';end if;

  perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',a::text,true);
  select object_id,object_version into r,v from public.save_personal_operational_record_v2(null,'CONTENT','M029 fixture',jsonb_build_object('status','DRAFT','body','safe fixture'),'DRAFT',null,'m029:create:content:a');
  select object_id,object_version into r2,v2 from public.save_personal_operational_record_v2(null,'CONTENT','M029 fixture',jsonb_build_object('status','DRAFT','body','safe fixture'),'DRAFT',null,'m029:create:content:a');
  if r<>r2 or v<>v2 then raise exception 'm029_create_idempotency_failed';end if;
  select object_version into v from public.save_personal_operational_record_v2(r,'CONTENT','M029 fixture v2',jsonb_build_object('status','DRAFT','body','safe fixture v2'),'DRAFT',1,'m029:update:content:a:v1');
  denied:=false;begin perform public.save_personal_operational_record_v2(r,'CONTENT','stale',jsonb_build_object('status','DRAFT'),'DRAFT',1,'m029:update:content:a:stale');exception when others then denied:=sqlerrm like '%m029_stale_or_not_found%';end;if not denied then raise exception 'm029_stale_update_not_denied';end if;

  select public.save_canonical_domain_draft('CONTENT',r,0,v,jsonb_build_object('body','draft pc'),'PC') into dv;
  if public.save_canonical_domain_draft('CONTENT',r,dv,v,jsonb_build_object('body','draft pc'),'PC')<>dv then raise exception 'm029_draft_retry_not_idempotent';end if;
  denied:=false;begin perform public.save_canonical_domain_draft('CONTENT',r,0,v,jsonb_build_object('body','stale iphone'),'IPHONE');exception when others then denied:=sqlerrm like '%m029_draft_stale_or_not_found%';end;if not denied then raise exception 'm029_stale_draft_not_denied';end if;

  insert into public.operational_objects(workspace_id,owner_user_id,object_type,title,state) values(wa,a,'QUICK_CAPTURE','M029 fixture','READY') returning id into q;
  select public.link_canonical_domain_objects('CONTENT',r,'QUICK_CAPTURE',q,'RELATES_TO',jsonb_build_object('source','M029_TEST')) into link_id;
  if public.link_canonical_domain_objects('CONTENT',r,'QUICK_CAPTURE',q,'RELATES_TO',jsonb_build_object('source','M029_TEST'))<>link_id then raise exception 'm029_link_idempotency_failed';end if;
  select public.convert_canonical_domain_object('QUICK_CAPTURE',q,'CONTENT',jsonb_build_object('title','Converted fixture','payload',jsonb_build_object('status','DRAFT')),'m029:convert:quick:content',jsonb_build_object('source','M029_TEST')) into c;
  select public.convert_canonical_domain_object('QUICK_CAPTURE',q,'CONTENT',jsonb_build_object('title','Converted fixture','payload',jsonb_build_object('status','DRAFT')),'m029:convert:quick:content',jsonb_build_object('source','M029_TEST')) into c2;
  if c<>c2 then raise exception 'm029_convert_idempotency_failed';end if;

  perform set_config('request.jwt.claim.sub',b::text,true);
  denied:=false;begin perform public.save_personal_operational_record_v2(r,'CONTENT','cross user',jsonb_build_object('status','DRAFT'),'DRAFT',v,'m029:cross:user:deny');exception when others then denied:=sqlerrm like '%m029_stale_or_not_found%';end;if not denied then raise exception 'm029_cross_user_not_denied';end if;
  denied:=false;begin perform public.link_canonical_domain_objects('CONTENT',r,'QUICK_CAPTURE',q,'RELATES_TO',jsonb_build_object('source','SPOOF'));exception when others then denied:=sqlerrm like '%m029_link_denied%';end;if not denied then raise exception 'm029_link_spoof_not_denied';end if;
  denied:=false;begin perform public.convert_canonical_domain_object('QUICK_CAPTURE',q,'CONTENT',jsonb_build_object('title','spoof'),'m029:convert:spoof:deny',jsonb_build_object('source','SPOOF'));exception when others then denied:=sqlerrm like '%m029_convert_source_denied%';end;if not denied then raise exception 'm029_convert_spoof_not_denied';end if;

  perform set_config('request.jwt.claim.sub',a::text,true);
  denied:=false;begin perform public.save_personal_operational_record_v2(r,'CONTENT','secret',jsonb_build_object('password','forbidden'),'DRAFT',v,'m029:secret:deny');exception when others then denied:=sqlerrm like '%unsafe_or_invalid_json%';end;if not denied then raise exception 'm029_secret_not_denied';end if;
  denied:=false;begin perform public.prepare_internal_action('chief_of_staff','CONTENT',r,'SEND','L3_EXECUTE','LOW','AUTO_LOW_RISK',jsonb_build_object('idempotency_key','m029:l3:denied'));exception when others then denied:=sqlerrm like '%internal_action_policy_denied%';end;if not denied then raise exception 'm029_l3_not_denied';end if;
  if has_table_privilege('authenticated','public.canonical_domain_drafts','INSERT') or has_table_privilege('anon','public.clients','TRUNCATE') or has_table_privilege('authenticated','public.operational_activity_events','INSERT') then raise exception 'm029_browser_direct_dml_not_denied';end if;

  perform set_config('request.jwt.claim.role','service_role',true);
  denied:=false;begin perform public.register_research_source(a,'https://example.invalid/m029','fixture','example.invalid','JP',null,'WEB','MEDIUM','PAID',null,'{}');exception when others then denied:=sqlerrm like '%research_source_cost_denied%';end;if not denied then raise exception 'm029_paid_cost_not_denied';end if;
end $$;
select jsonb_build_object('result','M029_EXECUTABLE_SECURITY_CONCURRENCY_PASS','production_mutation',false,'paid_ai_jpy',0,'external_execution','LOCKED') verification;
rollback;
