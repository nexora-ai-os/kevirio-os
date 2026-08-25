select jsonb_build_object('result',case when sum(v)=0 then 'M032_DATA_HEALTH_PASS' else 'FAIL' end,'violations',sum(v)) verification from(
 select count(*) v from public.affiliate_cycle_performance p left join public.affiliate_cycle_publications u on u.id=p.publication_id and u.workspace_id=p.workspace_id and u.owner_user_id=p.owner_user_id where u.id is null union all
 select count(*) from public.affiliate_revenue_candidates c left join public.affiliate_cycle_performance p on p.id=c.performance_id and p.workspace_id=c.workspace_id and p.owner_user_id=c.owner_user_id where p.id is null union all
 select count(*) from public.affiliate_revenue_evidence e left join public.affiliate_revenue_candidates c on c.id=e.candidate_id and c.workspace_id=e.workspace_id and c.owner_user_id=e.owner_user_id where c.id is null union all
 select count(*) from public.revenue_records r left join public.affiliate_revenue_candidates c on c.id=r.affiliate_revenue_candidate_id where r.origin_type='AFFILIATE_PROGRAM' and (c.id is null or r.lane<>'affiliate' or r.gross_amount_minor<>c.amount_minor or r.currency<>c.currency)
)x;
