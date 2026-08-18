# KEVIRIO Open Items and Decisions

## Control

This register contains only unresolved production-validation, first-sale, and next-step decisions. `Unknown` means repository evidence cannot prove external state. `Not Implemented` means the capability is absent.

| ID | Category | Item | Current State | Evidence | Impact | Dependency | Owner Decision | Recommended Action | Exit Criteria |
|---|---|---|---|---|---|---|---|---|---|
| C-01 | Database | Remote migrations 010–012 | Unknown | Files exist locally; latest Owner-reported remote application is 009 on 2026-07-27 | Provider Cost Guard/platform and AI Employee schema may be unavailable remotely | Authorized read-only Supabase inspection | No, verification only | Compare the remote ledger with local filenames; do not apply during audit | Remote ledger proves 010–012 applied in order, or a reviewed application plan exists |
| C-02 | Preview | Vercel linkage and Preview environment | Unknown | `vercel.json` exists; local CLI reports unlinked | Authenticated Preview validation cannot start | Vercel access and environment ownership | Yes if configuration is required | Link only after authorization; configure documented variable names without exposing values | Preview has required variables and a documented URL |
| H-01 | Validation | Authenticated browser validation | Blocked | Browser-control ACL and no reusable authenticated Owner session | Visual, responsive and real-session flows remain unverified | Working browser/session and Preview or local environment | No for testing; yes for session provision | Run the canonical desktop/mobile route checklist | Results include routes, console/network status and permitted screenshots |
| H-02 | Provider | Live Google/Canva OAuth state | Unknown | OAuth code exists; database/environment state was not queried | Integration UI cannot be declared live-ready | C-01, C-02, Owner test accounts | Yes before creating connections | Validate begin/callback/state/disconnect in Preview with test connections | Guarded lifecycle succeeds without credential exposure |
| H-03 | First sale | First real offer selected and executed | Not evidenced | No audited real offer run | Product value loop is not operationally proven | Preview, provider readiness, Owner-selected offer | Yes | Select one controlled offer and define acceptable manual actions | Offer reaches approved manual package and recorded outcome |
| H-04 | Revenue | Real Actual Revenue evidence validation | Not evidenced | Automated semantics pass; no real transaction evidence inspected | Actual Revenue claim lacks operational proof | H-03 and evidence source | Yes for evidence acceptance | Register and verify one controlled real record | Record appears only after evidence and approval checks |
| M-01 | Authentication | Password recovery | Not Implemented | No recovery route/workflow found | Owner lockout depends on external administration | Security decision and email configuration | Yes | Specify recovery policy before implementation | Reviewed flow, abuse controls, tests and audit evidence exist |
| M-02 | Product | Inbox backend/workflow | Not Implemented | Route/UI exists without production backend workflow | Inbox is not a reliable operational queue | Workflow/notification requirements | Yes | Define sources, read state, retention and workspace rules | Repository/API/RLS/tests are implemented |
| M-03 | Product | Settings mutations | Not Implemented | Settings route exists; production mutation flows absent | UI must not imply saved configuration | Settings ownership/authorization | Yes | Define allowed settings and server-side authorization | Controls have persistence, validation, audit and rollback |
| M-04 | Audit UX | Search, pagination and export | Not Implemented | Audit projection exists; capabilities are absent | Large histories are difficult to operate | Query/export policy and retention | Yes for export scope | Define safe fields and export authorization | Server-side features pass workspace/security tests |
| D-01 | Domain | Hold/deferred approval semantics | Ambiguous | Canonical Hold transition is not conclusively specified | UI could invent business behavior | Owner domain decision | Yes | Define Hold as status, non-decision, or timed transition | Transition table, RPC, audit event and copy are approved |
| D-02 | Authorization | Multi-user/admin/staff roles | Owner/Member Personal Workspace foundation accepted in ADR-002; broader staff roles remain open | Owner can administer Member lifecycle but cannot read private personal records | Broader roles cannot safely ship without a role matrix | Role matrix and lifecycle policy for any role beyond Owner/Member | Yes for broader roles | Preserve ADR-002 Personal Workspace isolation; add no broader role implicitly | RLS/RPC/UI tests prove least privilege for each introduced role |
| U-01 | Release | Deployment, domain and cache behavior | Unknown | No verified Preview/Production deployment evidence | Release decision cannot complete | C-02 and hosting access | Yes before Production | Validate Preview and document redirects, headers and rollback | Approved Preview report and explicit release decision |
| U-02 | Operations | Telemetry/alerting completeness | Unknown | Event structures exist; live monitoring was not evidenced | Failures/budget events may not reach operators | Deployment and alert owner | Yes for destinations | Inventory logs, alerts, retention and escalation | Test event reaches named channel with runbook link |
| K-01 | Security | React Router RSC advisory | Known Risk; accepted non-commit blocker | npm audit reports two High findings; app is Vite `BrowserRouter` SPA with no RSC evidence | Must remain tracked | Upstream patched release | No immediate decision | Monitor official update; retest before upgrade | Audit clears or SPA impact is evidenced and mitigated |
| D-03 | Artifact | `docs/audit.zip.zip` disposition | Unknown; intentionally excluded | Untracked and not canonical | Accidental commit may add opaque material | Owner identification | Yes | Keep untouched and untracked | Owner directs delete, archive, or reviewed inclusion |
| D-04 | Governance | Governance V2.1 status | Draft; not effective | Files state `DRAFT — OWNER REVIEW REQUIRED` | Proposals may be mistaken for policy | Owner review | Yes | Approve, revise, or reject explicitly | Status, date, version and supersession are recorded |

## Priority Order

1. Verify remote migrations 010–012 without mutation.
2. Establish an authorized Preview environment.
3. Complete authenticated browser validation.
4. Validate controlled provider OAuth/dry-run boundaries.
5. Run one Owner-selected offer through approval, manual package, evidence and Actual Revenue verification.

Nothing in this register authorizes code changes, migration application, external connections, deployment, staging, commit, or push.
