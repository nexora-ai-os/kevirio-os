begin;
drop function if exists public.delete_affiliate_program_master_if_safe(uuid,timestamptz,bigint,text);
drop function if exists public.update_affiliate_program_master_practical(uuid,timestamptz,bigint,jsonb);
commit;
select jsonb_build_object('result','M030_ROLLBACK_COMPLETE','recovery_retained',to_regnamespace('_m030_recovery') is not null) verification;
