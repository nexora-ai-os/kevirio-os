# M032 Affiliate Revenue Cycle

M032 is the smallest canonical bridge from Affiliate Program Master to the existing `revenue_records` Actual Revenue source of truth. It creates no Work, Opportunity, Application, Campaign, or second Actual table. Production apply requires separate Owner approval.

Order: preflight → snapshot → migration → read-only verification → data health → isolated executable fixture. Rollback removes fixture/accepted M032 rows first, restores the legacy revenue trigger and mandatory legacy columns, then drops only M032 objects.
