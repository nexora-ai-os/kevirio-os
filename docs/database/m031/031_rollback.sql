begin;
drop function if exists public.archive_affiliate_strategy(uuid,bigint,text);
drop function if exists public.confirm_affiliate_strategy(uuid,bigint,text);
drop function if exists public.review_affiliate_strategy(uuid,bigint,jsonb,text);
drop function if exists public.prepare_affiliate_strategy(uuid,uuid,uuid,jsonb,text);
drop function if exists public.m031_strategy_payload(jsonb);
drop table if exists public.affiliate_strategies;
commit;
