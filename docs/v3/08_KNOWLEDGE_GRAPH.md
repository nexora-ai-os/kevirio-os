# KEVIRIO V3 Knowledge Graph

## Purpose

The Knowledge Graph makes every business relationship queryable without replacing canonical records. Nodes reference domain identities; edges are typed, temporal and provenance-bearing. A graph claim has truth class, confidence, valid time, observed time, source and Workspace.

## Core graph

Business → Revenue Engine/Program → Product/Offer → Campaign/Strategy → Content → Publication → Evidence → Revenue/Cost → Learning → Asset/Business Memory. AI Employees perform Tasks within Operations, attend Meetings, propose Insights and Strategies, and contribute Evidence. Decisions approve or reject immutable target versions.

## Edge vocabulary

`OWNS`, `BELONGS_TO`, `IMPLEMENTS`, `TARGETS`, `PROMOTES`, `DERIVED_FROM`, `PUBLISHED_AS`, `SUPPORTED_BY`, `GENERATED_REVENUE`, `INCURRED_COST`, `LEARNED_FROM`, `REUSES`, `PERFORMED_BY`, `DISCUSSED_IN`, `PROPOSES`, `APPROVED_BY`, `SUPERSEDES`, `CONFLICTS_WITH`.

## Query contract

All queries require Workspace scope, temporal boundary, truth filter and bounded pagination. Examples: evidence path from strategy to Actual Revenue; reusable assets linked to successful learning; decisions affected by a stale assumption; AI Employees whose outputs correlate with profit, without claiming causation unsupported by experiments.

## Integrity and conflict

Edges cannot create authority absent in their source aggregate. Conflicting claims coexist and point to their evidence; resolution adds a decision/superseding claim. Deletion follows retention policy but leaves safe tombstone lineage where Audit requires it. Raw secrets, provider payloads and unrestricted personal data never enter graph metadata.

## Scale

Start with relational adjacency/projection tables backed by canonical IDs. Introduce specialized graph infrastructure only after query evidence proves need. Partition by Workspace, cache common traversals, cap depth/fan-out and rebuild projections from canonical events.
