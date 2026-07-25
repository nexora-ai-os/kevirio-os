# Implementation Plan

1. Stabilize dependency/test/env baseline.
2. Protect all App content with verified Supabase Owner session.
3. Add generic workspace/brand/client boundary and RLS.
4. Add canonical Revenue business tables and repository boundary.
5. Add deterministic state/evidence/egress contracts.
6. Add durable workflow schema, immutable approvals and Actual ledger RPC.
7. Add unit/integration/contract E2E and CI.
8. Keep Direct Service manual execution candidate locked.

Production external execution remains excluded until every security gate passes remotely.
