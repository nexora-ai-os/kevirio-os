select jsonb_build_object(
 'result',case when to_regclass('public.affiliate_strategies') is null
  and to_regclass('public.operational_objects') is not null
  and to_regclass('public.canonical_domain_drafts') is not null
  and to_regprocedure('public.update_affiliate_program_master_practical(uuid,timestamp with time zone,bigint,jsonb)') is not null
  then 'M031_ROLLBACK_M030_BASELINE_PASS' else 'FAIL' end,
 'm031_absent',to_regclass('public.affiliate_strategies') is null,
 'm028_retained',to_regclass('public.operational_objects') is not null,
 'm029_retained',to_regclass('public.canonical_domain_drafts') is not null,
 'm030_retained',to_regprocedure('public.update_affiliate_program_master_practical(uuid,timestamp with time zone,bigint,jsonb)') is not null,
 'paid_ai_jpy',0,'external_execution','LOCKED') verification;
