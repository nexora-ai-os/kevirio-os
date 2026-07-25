# Actual Revenue Evidence Model

Evidence candidate is not revenue. Required fields: workspace, campaign, supported source type, unique external source reference, integer minor-unit amount/cost, ISO currency, occurrence time and Owner submitter.

Actual creation requires:

1. `actual_revenue_verification` approval request.
2. Immutable approved decision.
3. Evidence verification through `verify_evidence_and_record_revenue`.
4. Unique evidence candidate.
5. `net = gross - cost` database check.

Forecast remains on campaigns and never enters `revenue_records`.
