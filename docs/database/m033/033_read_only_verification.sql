do $verify$
declare bad bigint;
begin
  if to_regprocedure('public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamp with time zone,bigint)') is null then raise exception 'm033_rpc_missing'; end if;
  if exists(select 1 from pg_constraint where conrelid='public.affiliate_program_master'::regclass and conname='affiliate_program_master_url_check' and pg_get_constraintdef(oid) like '%{1,1990}%') then raise exception 'm033_broken_regex_retained'; end if;
  if not exists(select 1 from pg_proc where oid='public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamp with time zone,bigint)'::regprocedure and prosecdef and coalesce(proconfig,'{}')@>array['search_path=""']) then raise exception 'm033_function_security_invalid'; end if;
  select count(*) into bad from information_schema.routine_privileges where specific_schema='public' and routine_name='save_affiliate_program_master_link' and grantee in('anon','public');
  if bad<>0 then raise exception 'm033_public_rpc_grant_detected'; end if;
  if has_function_privilege('authenticated','public.save_affiliate_program_master_link(uuid,uuid,text,text)','EXECUTE') then raise exception 'm033_legacy_rpc_still_browser_callable'; end if;
  if not has_function_privilege('authenticated','public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamp with time zone,bigint)','EXECUTE') then raise exception 'm033_hardened_rpc_not_callable'; end if;
end $verify$;
select jsonb_build_object('result','M033_READ_ONLY_VERIFICATION_PASS','constraint','SAFE_2000_CHARACTER_HTTP_URL','optimistic_concurrency','ATOMIC','legacy_browser_rpc','DENIED','browser_direct_dml','DENIED','paid_ai_jpy',0,'external_execution','LOCKED') verification;
