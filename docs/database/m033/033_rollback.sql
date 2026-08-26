begin;
select pg_advisory_xact_lock(hashtextextended('kevirio:m033:affiliate-write-contract',0));
revoke all on function public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamptz,bigint) from public,anon,authenticated;
drop function public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamptz,bigint);
alter table public.affiliate_program_master drop constraint affiliate_program_master_url_check;
alter table public.affiliate_program_master add constraint affiliate_program_master_url_check check(affiliate_url is null or affiliate_url~'^https?://[^[:space:]]{1,1990}$');
grant execute on function public.save_affiliate_program_master_link(uuid,uuid,text,text) to authenticated;
commit;
select jsonb_build_object('result','M033_ROLLBACK_M032_BASELINE_RESTORED','business_rows_changed',0,'recovery_retained',to_regclass('_m033_recovery.contract_snapshot') is not null) verification;
