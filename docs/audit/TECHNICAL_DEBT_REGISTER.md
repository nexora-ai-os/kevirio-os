# Technical Debt Register

| ID | Priority | Debt | Evidence | MVP |
|---|---|---|---|---|
| TD-001 | P0 | Business SoT/RLS absent | only 4 sandbox tables | blocking |
| TD-002 | P0 | App-wide Auth absent | Gate only at App:167 | blocking |
| TD-003 | P0 | Revenue flow fragmented across localStorage schemas | App keys/services | blocking |
| TD-004 | P0 | Actual revenue evidence/ledger absent | explicit false guards | blocking |
| TD-005 | P0 | Durable approval/workflow absent | no run/step tables | blocking |
| TD-006 | P1 | No standard test/lint/typecheck/CI | package.json | pre-release |
| TD-007 | P1 | High PostCSS advisory | npm audit | pre-release |
| TD-008 | P1 | Mojibake in user/security copy | multiple source files | approval accuracy |
| TD-009 | P1 | 890.51kB monolithic JS | build warning | performance |
| TD-010 | P2 | New/legacy engines duplicate domains | App/service map | post-MVP |
| TD-011 | P2 | Env contract/example absent | no `.env.example` | operability |
| TD-012 | P2 | Test count labels stale | 25/14, 43/10 | reliability |
| TD-013 | P2 | Retention/deletion/incident docs absent | repository | privacy |
| TD-014 | P3 | unused lucide candidate/dependency placement | import scan/package | cleanup |
