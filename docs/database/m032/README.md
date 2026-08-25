# M032 Affiliate Revenue Cycle

M032 is an additive Affiliate revenue-cycle extension. Existing `revenue_records`, its legacy Evidence-first contract, constraints, and triggers remain byte-for-byte untouched. Affiliate Actual is a formally scoped Evidence-first subtype in `affiliate_actual_revenue_extensions`; it cannot exist independently of an exact confirmed Candidate and unique verified Evidence. It creates no Work, Opportunity, Application, Campaign, or fabricated legacy object. Production apply requires separate Owner approval.

Order: preflight → snapshot → migration → read-only verification → data health → isolated executable fixture. Rollback removes fixture/accepted M032 rows first, restores the legacy revenue trigger and mandatory legacy columns, then drops only M032 objects.
