# M026 Affiliate Program Master Owner Edit — Validation and Acceptance

Date: 2026-08-20 JST
Migration: `026_affiliate_program_master_owner_edit.sql`
Owner approval: Explicitly approved before execution
External Execution: `LOCKED`
Paid AI: `¥0`

## Activation evidence

- M001–M026 clean local migration: PASS.
- Targeted Owner register/read/update/Pause/Archive validation: PASS.
- Optimistic concurrency stale-write denial: PASS.
- Member, cross-user, and cross-workspace denial: PASS.
- Transaction rollback and separate fixture residue check: PASS.
- Full automated tests: PASS — unit 313, integration 175, e2e 14.
- JavaScript syntax: PASS — 327/327.
- Source policy: PASS — 480 files.
- Security verification: PASS — credential boundary 27/27; credential exposure 20/20.
- Production build: PASS.
- Browser Validation: BLOCKED — no in-app or connected browser was available on 2026-08-20.

## Production backup and apply

The remote migration ledger was exactly M001–M025 before activation. A pre-apply backup was written outside the repository under the local temporary backup directory.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `schema.sql` | 415594 | `99B502ECB1F896B1E9A26477956DA858FE243B8E0715AA92BAF0B45A83CA572D` |
| `public-data.sql` | 321060 | `3DA9E968B7E4F4825EAA5D309B492C155AA9CAAC5E22E5BDC935E29AE96C6D42` |
| `roles.sql` | 297 | `25873CEC56A2CC6514E204F420231777F85C03DA818CAA7090CDCDFA89776ECD` |

The data-only dump reported circular foreign-key restore warnings for `owner_decisions`, `revenue_records`, and `ai_employee_handoffs`; a restore must use an appropriate constraint/trigger-aware procedure.

- Production dry-run target: M026 only — PASS.
- Production apply: PASS.
- Remote ledger after apply: M001–M026 aligned.
- Read-only post-apply checks: protected RPC exists; authenticated execute is present; monotonic `clock_timestamp()` touch function is active.
- Production alias: unchanged.

## Owner acceptance preparation

1. Sign in as the Owner and open Affiliate Program Master.
2. Open a program detail and confirm Edit fields render without exposing a full affiliate URL in the list.
3. Save a harmless Owner note edit and confirm the refreshed canonical value.
4. Open the same record in two sessions, save in one, then confirm the stale second save is rejected as a conflict.
5. Pause, resume, then Archive a disposable test program and confirm each canonical state after refresh.
6. Confirm a Member cannot read or mutate Owner Affiliate Program Master records.
7. Confirm External Execution remains `LOCKED`, Actual Revenue is unchanged, and Paid AI remains `¥0`.
8. Record Owner acceptance only after browser validation is completed; do not infer acceptance from deployment.
