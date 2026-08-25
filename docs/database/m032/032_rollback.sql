begin;
do $$ begin if exists(select 1 from public.affiliate_revenue_candidates where status='CONFIRMED_ACTUAL') then raise exception 'm032_accepted_actual_freeze_export_required';end if;end $$;
drop function if exists public.confirm_affiliate_actual_revenue(uuid,bigint,uuid,text),public.attach_affiliate_revenue_evidence(uuid,bigint,text,text,bigint,text,timestamptz,jsonb,text),public.create_affiliate_revenue_candidate(uuid,text,bigint,text,text,text,timestamptz,timestamptz,jsonb,text),public.record_affiliate_cycle_performance(uuid,bigint,timestamptz,bigint,bigint,bigint,bigint,bigint,text,text,text),public.save_affiliate_cycle_publication(uuid,bigint,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text),public.m032_owner_cycle_context(uuid,uuid,uuid,uuid);
drop table public.affiliate_actual_revenue_extensions,public.affiliate_revenue_evidence,public.affiliate_revenue_candidates,public.affiliate_cycle_performance,public.affiliate_cycle_publications;
drop function if exists public.m032_audit_cycle_change();
commit;
