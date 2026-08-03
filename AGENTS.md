# KEVIRIO Repository Instructions

Read [Architecture Decision Records](docs/architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) and the [KEVIRIO Glossary](docs/governance/KEVIRIO_GLOSSARY.md) before work. Do not redefine terms, ignore ADR rationale, or mark an ADR `ACCEPTED` without explicit Owner approval. If implementation conflicts, stop and report it. Material architecture change updates an applicable existing ADR; do not create another foundation-governance document.

Read [Architecture Decision Records](docs/architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) and the [KEVIRIO Glossary](docs/governance/KEVIRIO_GLOSSARY.md) before work. Do not redefine terms, ignore ADR rationale, or mark an ADR `ACCEPTED` without explicit Owner approval. If implementation conflicts, stop and report it. Material architecture change updates an applicable existing ADR; do not create another foundation-governance document.

Read [docs/governance/KEVIRIO_GOVERNANCE_INDEX.md](docs/governance/KEVIRIO_GOVERNANCE_INDEX.md) before changing this repository.

- Preserve Approval, Evidence, Actual Revenue, Cost Guard, Workspace, Provider, Audit, RLS, protected RPC, and authentication boundaries.
- Keep Mock/Forecast/Test data separate from Actual data. Keep External Execution fail-closed.
- Never edit migrations `003`–`009`; database changes are additive migration `010+`.
- Commit, push, and deploy each require explicit Owner approval.
- If browser validation is unavailable, report `Browser Validation: BLOCKED`, never PASS.
