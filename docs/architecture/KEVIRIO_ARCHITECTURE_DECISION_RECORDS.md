# KEVIRIO Architecture Decision Records

| Metadata | Value |
|---|---|
| Document name | KEVIRIO Architecture Decision Records |
| Version | 1.0 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Authority | Records rationale and change conditions; does not override the Constitution or Architecture Baseline |
| Last reviewed | 2026-08-01 |
| Source of Truth level | Design-decision record, subordinate to explicit Owner decisions and an approved Constitution |

## Reading and Status Rules

Read after the Development Constitution and before the Architecture Baseline. `ACCEPTED` is reserved for an explicitly evidenced Owner approval. Current implementation alone does not make a decision accepted. Each record below is therefore `PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED` unless its Current State says otherwise.

# ADR-001 — KEVIRIOをAI Company Operating Systemとして定義する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

KEVIRIOはチャットツールや汎用Dashboardではなく、Ownerが最終判断しAI Employeeが準備・実行支援・計測・改善を行うAI Company Operating Systemとして扱う。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: docs/governance/KEVIRIO_DEVELOPMENT_CONSTITUTION.md §§1–2; KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md §§2–3
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-002 — Owner-Only Authenticationを初期Production境界とする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

初期Production利用者を検証済みOwnerに限定し、Supabase AuthのsessionだけでなくOwner profileのrole/statusも検証する。Staff/Admin/Multi-userはNot ImplementedとしてFail Closedにする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: src/components/SupabaseOwnerAuthGate.jsx; server/verifiedOwnerContext.js; tests/unit/owner-login-integrity.test.mjs
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-003 — Workspace BoundaryをRLS・RPC・Repositoryで多層保護する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

すべてのProductionデータ操作でWorkspace membership、RLS、Protected RPC、Repositoryを重ね、client側filterだけを信頼境界にしない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: supabase/migrations/003_revenue_foundation.sql; revenue/offer repositories; credential-boundary tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-004 — Repository PatternとProtected RPCをProduction Data Boundaryとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

画面からのProduction mutationをRepository経由に集中し、整合性を要する変更はProtected RPCのtransaction、validation、workspace check、auditに委ねる。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: src/repositories; protected RPCs in migrations 003–012; integration tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-005 — ApprovalをImmutable Snapshotとして扱う

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Approval対象は判断時点のexact snapshot、version/hash、期限および一回性を保持し、承認後に内容が変わった場合は同じ承認を流用しない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: migrations 003, 005, 007–008; revenueRepository; approval integration tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-006 — Evidence FirstでActual Revenueを確定する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Evidence Candidateを検証し、必要なApproval整合性を通過したrecordだけをActual Revenueとする。Forecast、Mock、Unknown、ZeroをActualへ混入しない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: migrations 003, 005, 008; revenueRepository; Master Handover §§15–16
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-007 — External ExecutionをFail Closed / LOCKEDとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

External Executionは明示的な全gateが成立するまでLOCKEDとする。Approvalだけで解除せず、Manual Execution PackageとDry Runを安全な代替経路とする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: provider/runtime configuration; manual execution package RPCs; Architecture Baseline §7
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-008 — Google Operationsを最初のProduction候補AI Employeeとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

最初のAI Employee候補をGoogle Operationsとするが、現状はConditionalかつDry RunでGoogle API call 0とする。Production eligibilityは別途検証する。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: AI Employee registry; /api/employee; migration 012; Google Operations tests/documentation
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-009 — AI Employee ContractをProduction追加の必須条件とする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

AI Employee追加にはRole、Permission、Input/Output、Cost、Failure/Retry、Log/Metrics、Workflow、Approval、Evidence、Latency、Version、Prompt Hashを定義し、不明要素はFail Closedにする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: Development Constitution §11; migration 012; AI Employee registry
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-010 — Provider CredentialをServer-Onlyで管理する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Provider secret、OAuth token、service credentialをclientへ渡さずserver gateway/storageで扱い、表示・log・errorではredactionする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: server/provider modules; .env.example variable names; credential suites
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-011 — Provider Cost GuardをFail Closedとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Provider実行前にbudget/quotaを予約し、完了時にledgerへ確定し、失敗時にreleaseする。Allowlist、threshold、circuit breakerが不明または不健全なら実行しない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: migration 010; provider cost runtime/tests; Master Handover §20
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-012 — Migration 003–009を不変とし010以降をAdditiveとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

適用履歴を保つためMigration 003–009を編集せず、変更は010以降のadditive migrationとする。Remote stateを証拠なしにAppliedとしない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: supabase/migrations/003–012; AGENTS.md; Runbook §6
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-013 — Production / Conditional / Mock / Lockedの成熟度を明示する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Feature maturityをProduction、Conditional、Mock、Locked、Unknown等で明示し、UI・Release報告・Handoverで状態を隠さない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: Governance Index status vocabulary; Architecture Baseline §3
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-014 — UIをJapanese-FirstかつBright Premium Brandとする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Owner UIは日本語を主言語とし、White × Champagne Gold × Silver × Soft Blue × Pale PurpleとGold Kを基準にする。Dark/Mint/Aquaを標準へ再解釈しない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: docs/ui design documents; design-system tokens; Owner visual directive
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-015 — UI Freezeを設ける

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

承認済みUIをFreezeし、無制限な再設計を防ぐ。Bug、overflow、accessibility、文言、API接続に伴う最小変更以外の全面変更はOwner承認を必要とする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: docs/ui closure/validation reports; Runbook §4; UI tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-016 — Route-Level / Screen-Level Lazy Loadingを採用する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Production画面をroute/screen単位でlazy loadし、initial bundleから不要なscreenとLegacy Mock graphを分離し、Labsも隔離する。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: src/App.jsx route imports; Vite build output; lazy-loading tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-017 — LabsをFail-Closed Developer Mode配下へ隔離する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

`/labs/components`のみを、verified Owner authenticationと`VITE_DEVELOPER_MODE=true`のAND条件で公開する。disabled/unknown時は404、fixturesのみ、Production navigation非表示とする。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: src/App.jsx; component lab; VITE_DEVELOPER_MODE checks; tests
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-018 — Commit / Push / Deployを個別Owner承認とする

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Commit、Push、Deployを別々の不可逆性を持つgateとして扱い、それぞれ直前のOwner承認を必要とする。Dirty working treeのOwner-owned変更を保護する。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: Runbook §5; Owner release decisions; Git history at 4837c813
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-019 — Validation Levelを段階で管理する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Source Validated、Build Validated、Browser Validated、Owner Approvedを別段階とし、下位段階の成功を上位段階の成功として報告しない。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: Runbook §7; Validation Evidence; browser status
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: YES within the repository scope described
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: Not required for the local design record; affected external state may remain UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

# ADR-020 — PromptとAI実行をVersion管理する

## Metadata

- Status: PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED
- Decision date: UNKNOWN — no reliable approval-date evidence found
- Last reviewed: 2026-08-01
- Owner: KEVIRIO Owner
- Decision authority: Owner approval required
- Related Constitution sections: §§1–11 as applicable
- Related Architecture sections: current feature/boundary sections
- Related Runbook sections: change, validation and release gates
- Related ADRs: ADR-001–020 where boundaries intersect

## Context

KEVIRIO must preserve product truth, security boundaries and operational recoverability while evolving. Repository implementation evidences this pattern, but implementation is not proof of formal Owner acceptance.

## Decision

Prompt version/hash、model、temperature、input/output、cost、latency、retryを実行記録と結び、再現性とauditabilityを確保する。未実装フィールドはNot Implementedとして扱う。

## Rationale

This decision prevents ambiguous authority, silent state promotion, cross-boundary data mutation, or an operational claim unsupported by repository evidence. Its exact rationale is supported by the Evidence section; where evidence is absent, the state remains UNKNOWN.

## Alternatives Considered

| Alternative | Advantages | Disadvantages | Why not selected | Evidence status |
|---|---|---|---|---|
| Remove this boundary | Lower short-term implementation effort | Weakens integrity, security, or product truth | Conflicts with current implementation and documented constraints | DOCUMENTED / IMPLEMENTED |
| Client- or UI-only enforcement | Simple presentation logic | Not a trustworthy security or transaction boundary | Cannot protect server data or external execution | VERIFIED in architecture principles |
| Defer all behavior | Lowest immediate risk | Blocks implemented controlled capabilities | Current guarded implementation provides a safer incremental path | CONDITIONAL |

## Consequences

### Positive

Clear ownership, testable invariants, explicit maturity and safer incremental change.

### Negative

Additional gates, metadata, tests and Owner review increase implementation and release effort.

### Risks

Documentation can drift from source or an unverified remote environment can be mistaken for local implementation.

### Operational Impact

Operators must preserve gates, label Unknown/Mock/Locked states and collect evidence before promotion.

### Development Impact

Changes that alter this decision require ADR review plus the applicable architecture, test and rollback work.

### Owner Impact

The Owner retains authority for acceptance and for any change that broadens permissions, execution or release scope.

## Invariants

- Mock, Forecast and Unknown never become Actual by presentation alone.
- Workspace, credential, approval, evidence, Cost Guard and audit boundaries cannot be bypassed.
- Missing configuration or evidence fails closed.
- Owner approval is never inferred.

## Change Conditions

Change only with explicit Owner approval, evidence of the proposed replacement, security/data-impact review, tests and a documented rollout/rollback path.

## Migration / Rollback

Documentation rollback is removal of the unapproved proposal reference. Runtime migration/rollback is UNKNOWN until a concrete change is proposed; never edit applied migrations in place.

## Evidence

- Source / Migration / Tests / Documentation / Git: AI Employee/provider execution records and contracts; migration 012; Constitution §11
- Git baseline: `4837c813c75794837ef10d83c564afdee87f3761`
- Owner-reported evidence: prior directives establish the recorded constraints; formal acceptance of this ADR document is not yet verified.

## Current State

- Implemented: PARTIAL — prompt/execution metadata exists in platform contracts but complete runtime coverage is not proven
- Tested: Source/automated evidence exists as cited; coverage is not universal
- Browser validated: BLOCKED
- Owner approved: NO — review required
- Remote verified: UNKNOWN
- Known conflicts: See Conflict Audit
- Known gaps: Owner acceptance and any external-state verification remain open

## Conflict Audit

| ID | Term / Decision | Source A | Source B | Conflict | Risk | Recommended Owner Decision |
|---|---|---|---|---|---|---|
| CF-001 | Hold | UI/domain references | Protected approval RPC vocabulary | Canonical Hold transition is not conclusively defined | UI may invent a business transition | Define Hold as status, non-decision, or timed transition |
| CF-002 | Migration remote state | Owner report: through 009 applied | Local files 010–012 exist | Local presence does not prove remote application | Runtime/schema drift | Verify remote ledger read-only |
| CF-003 | Governance authority | V2.1 and these v1.0 documents | Explicit Owner decisions | Documents are Draft, not effective | Draft mistaken for binding policy | Approve/revise/reject explicitly |
| CF-004 | README product label | “v5.2 Social Revenue Engine” | Current Constitution/Handover | Historical/narrow label differs from AI Company Operating System definition | Product misunderstanding | Treat legacy README content as historical until separately revised |
| CF-005 | Google Operations maturity | Production candidate language | Dry Run, API call 0 | Candidate is not live Production execution | Overstatement of readiness | Retain CONDITIONAL until gates pass |

## ADR Change Policy

A new or revised ADR is required for material changes to authentication, workspace boundaries, repository/RPC boundaries, migration policy, Approval, Evidence/Actual Revenue, External Execution, provider credentials, Cost Guard, AI Employee contracts, multi-user roles, deployment architecture, major UI governance, revenue calculation, or audit integrity. Bug fixes, copy/CSS adjustments, tests, internal refactors and in-boundary implementation details do not require a new ADR unless they alter an invariant.

No additional foundation governance document is authorized by this closure; update these records instead.

## V1.1 Affiliate Intelligence candidate note (Owner acceptance pending)

Status: PROPOSED / NOT ACCEPTED

Migration 014 candidate introduces an Affiliate Intelligence specialization without replacing any canonical source of truth:

- `affiliate_offers` remains the Offer authority.
- Approval, Execution Package, Evidence, Actual Revenue, Actual Cost and Content remain governed by their existing canonical tables and protected workflows.
- `affiliate_programs`, `affiliate_materials`, `affiliate_publications` and `affiliate_performance_records` hold only Affiliate-specific metadata and references.
- Every added entity is Workspace-scoped. Active Owners receive read access; browser direct mutations remain revoked. A protected RPC validates active Owner membership for Draft persistence.
- Actual, Forecast, Inference and Unknown remain distinct. Missing or unknown state cannot become completion or Actual.
- External Execution remains false and fail-closed. Provider login, scraping and publication are outside the candidate.

Rationale and evidence are recorded in `docs/implementation/AFFILIATE_INTELLIGENCE_V1_1.md` and the Migration 014 validation package. This note does not mark an ADR ACCEPTED; explicit Owner review is still required.
