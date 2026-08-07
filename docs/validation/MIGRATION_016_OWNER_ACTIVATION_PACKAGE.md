# Migration 016 Owner Activation Package

Status: SAVED CANDIDATE — NOT APPLIED

Canonical candidate SHA-256: FEBB0D695FEF8E2FBCFFECC0B0DD7B18114C87950EA3F6976422DDC6C868DE84

Canonical representation: UTF-8, no BOM, LF line endings, exactly one final newline. The future Git blob must reproduce this SHA before activation.

Production Applied: NO

Purpose: add only Organization, Business, Organization/Workspace, Team and Team Membership authorities. Workspace, Owner, AI Employee/Task, Approval, Evidence, Actual Revenue/Cost, Provider, Credential and Audit remain canonical.

Synchronized files: Migration, pre-check, post-smoke, parser, static validator and focused integration test. Every artifact records the frozen candidate SHA.

Safety: additive, transaction-wrapped, no seed or ledger insertion, composite Workspace foreign keys, RLS active-Owner reads, anon denied, authenticated mutation denied, service-role protected idempotent RPCs, safe metadata, audit events and External Execution constrained false.

Pre-check verifies parent authority, Migration 001–015 compatibility, collisions, fixed SHA metadata and LOCKED status. Post-smoke verifies five tables, columns, constraints, business/lifecycle checks, composite FKs, indexes, RLS, exact policy, privileges, protected RPC security, Owner/Workspace enforcement, audit contract, updated-at triggers, External Execution constraints and empty initial state.

No SQL was executed. Future activation requires separate Owner authorization, PRE APPLY PASS, exact Git-blob SHA confirmation, apply once and POST APPLY SMOKE PASS.
