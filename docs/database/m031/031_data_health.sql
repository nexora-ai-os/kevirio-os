select jsonb_build_object('result',case when count(*)=0 then 'M031_DATA_HEALTH_PASS' else 'FAIL' end,'violations',count(*)) verification
from public.affiliate_strategies s
where not exists(select 1 from public.affiliate_program_master p where p.id=s.affiliate_program_id and p.workspace_id=s.workspace_id)
   or not exists(select 1 from public.research_findings r where r.id=s.source_research_id and r.workspace_id=s.workspace_id and r.owner_user_id=s.owner_user_id)
   or (s.status='ARCHIVED')<>(s.archived_at is not null)
   or s.inference_metadata->>'evidence_status'<>'NOT_EVIDENCE';
