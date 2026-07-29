# KEVIRIO UI/UX IMPLEMENTATION HANDOFF — RC1

**Date:** 2026-07-29  
**Package:** KEVIRIO UI/UX Release Candidate RC1  
**Purpose:** Development handoff for production UI migration

## Files

1. `KEVIRIO_UI_UX_MASTER_SPEC_v1.0_RC1.md`  
   Normative product, UX, visual, component, screen, accessibility, performance, migration, and acceptance specification.

2. `KEVIRIO_IMPLEMENTATION_MASTER_PROMPT_v1.0_RC1.md`  
   Execution protocol for the development team or AI coding agent.

3. `KEVIRIO_UI_RC1_MANIFEST.json`  
   Package metadata and integrity hashes.

## Instruction to Development

Treat the Master Spec as the UI/UX source of truth, subordinate only to the KEVIRIO Product
Constitution and verified production architecture constraints.

Do not begin with a visual rewrite.

Begin with:
1. repository audit;
2. baseline build and tests;
3. exact mapping of canonical repositories, approval contracts, revenue evidence flow,
   provider states, Cost Guard, audit, and workspace boundaries;
4. Production/Mock inventory;
5. phased implementation.

## Critical Constraints

- Owner-only access remains.
- Workspace boundaries remain.
- Approval snapshot/hash/version/expiry/one-time use remain.
- Actual revenue requires verified evidence.
- Unknown is not zero.
- Approval is not execution.
- Connection is not permission.
- Manual package creation is not delivery.
- Provider credentials remain server-only.
- Cost Guard remains fail-closed.
- Google Operations remains Dry Run.
- External Execution remains false.
- Mock and Production are separated.

## Required First Response from Development

Return:

1. repository paths verified;
2. canonical data sources verified;
3. contradictions or gaps;
4. migration risks;
5. proposed PR sequence;
6. baseline build/test results;
7. bundle baseline;
8. questions requiring Owner decision.

Do not return only “understood” or a generic implementation plan.

## Release Status

This package is complete as a design and implementation Release Candidate.
It may be sent to development immediately for repository verification.

It becomes `v1.0 Final` after development verifies the live repository mappings and any
repository-specific corrections are incorporated. This is intentional: a source-accurate final
implementation specification cannot truthfully hard-code unverified file paths or backend field
names.

No additional design ideation is required before development begins.
