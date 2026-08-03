# KEVIRIO Governance Index

| Metadata | Value |
| --- | --- |
| Document name | KEVIRIO Governance Index |
| Version | 2.1 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Supersedes | None until approved |
| Source of Truth level | Navigation index; the precedence below controls |
| Last reviewed | 2026-07-31 |
| Change summary | Introduces the three-tier development governance structure for Owner review. |

## Governing documents

1. [Development Constitution](KEVIRIO_DEVELOPMENT_CONSTITUTION.md) — immutable product and engineering principles.
2. [Architecture and Production Baseline](../architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md) — evidence-based current implementation and maturity.
3. [Development and Release Runbook](../runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md) — mandatory execution and release procedure.
4. [Governance Changelog](KEVIRIO_GOVERNANCE_CHANGELOG.md) — governance revision history.

## Authority and precedence

When two sources conflict, use this order:

1. The latest explicit Owner approval applicable to the change.
2. The latest Owner-approved Development Constitution.
3. The latest Owner-approved Architecture and Production Baseline.
4. The latest Owner-approved Development and Release Runbook.
5. Migrated, still-applicable content from the 2026-07-27 Master Handover and activation records.
6. Current repository implementation.
7. Older reports, plans, prompts, and audit snapshots.

These Version 2.1 documents are drafts. They do not become `APPROVED`, effective, or higher authority than existing Owner decisions until the Owner explicitly approves them. Historical reports remain evidence of their recorded date, not automatic descriptions of the current implementation.

## Non-negotiable boundaries

- KEVIRIO is an AI Company Operating System. It is not a generic SaaS dashboard.
- The Owner makes final decisions. AI operates only inside explicit permissions.
- External Execution is fail-closed and remains locked unless separately approved and enabled through its full security gates.
- Dry Run, Approval, Evidence, Cost Guard, Workspace isolation, and append-only Audit semantics must not be bypassed.
- Actual, Forecast, Mock, Sample, Test, and Unconnected values must remain explicitly separated.
- Migrations `003` through `009` are historical applied artifacts and must never be edited in place. Database changes are additive migrations numbered `010` or later.
- Commit, push, and deploy each require their own explicit Owner approval.

## Design knowledge reading order

1. [Development Constitution](KEVIRIO_DEVELOPMENT_CONSTITUTION.md)
2. [Architecture Decision Records](../architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) — rationale; Version 1.0 Draft pending Owner review
3. [Architecture and Production Baseline](../architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md)
4. [KEVIRIO Glossary](KEVIRIO_GLOSSARY.md) — canonical vocabulary; Version 1.0 Draft pending Owner review
5. [Development and Release Runbook](../runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md)
6. [Current Master Handover](../../KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md)
7. [Development Restart Prompt](../handover/KEVIRIO_DEVELOPMENT_RESTART_PROMPT.md)

ADR explains why without overriding higher authority. Glossary fixes meaning without changing behavior.

## Design knowledge reading order

1. [Development Constitution](KEVIRIO_DEVELOPMENT_CONSTITUTION.md)
2. [Architecture Decision Records](../architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) — rationale; Version 1.0 Draft pending Owner review
3. [Architecture and Production Baseline](../architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md)
4. [KEVIRIO Glossary](KEVIRIO_GLOSSARY.md) — canonical vocabulary; Version 1.0 Draft pending Owner review
5. [Development and Release Runbook](../runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md)
6. [Current Master Handover](../../KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md)
7. [Development Restart Prompt](../handover/KEVIRIO_DEVELOPMENT_RESTART_PROMPT.md)

ADR explains why without overriding higher authority. Glossary fixes meaning without changing behavior.

## Status vocabulary

## Design knowledge reading order

1. [Development Constitution](KEVIRIO_DEVELOPMENT_CONSTITUTION.md)
2. [Architecture Decision Records](../architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) — rationale; Version 1.0 Draft pending Owner review
3. [Architecture and Production Baseline](../architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md)
4. [KEVIRIO Glossary](KEVIRIO_GLOSSARY.md) — canonical vocabulary; Version 1.0 Draft pending Owner review
5. [Development and Release Runbook](../runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md)
6. [Current Master Handover](../../KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md)
7. [Development Restart Prompt](../handover/KEVIRIO_DEVELOPMENT_RESTART_PROMPT.md)

ADR explains why without overriding the Constitution or current implementation evidence. Glossary fixes meaning without changing behavior.

- `PRODUCTION`: implemented, production-backed, and not dependent on an unresolved gate within the stated scope.
- `CONDITIONAL`: implemented but dependent on environment, remote state, Owner verification, or another declared gate.
- `MOCK`: fixture, deterministic local simulation, or non-production data/behavior.
- `LOCKED`: deliberately unavailable or fail-closed.
- `Not Implemented`: no production implementation exists.
- `Unknown`: repository evidence is insufficient.
