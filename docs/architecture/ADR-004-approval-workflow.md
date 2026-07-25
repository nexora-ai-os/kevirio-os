# ADR-004: Approval and Workflow

Decision: approval requests are mutable state; approval decisions are immutable and created through a server RPC. Workflow runs/steps hold reload-safe checkpoints, bounded attempts, correlation IDs and sanitized failure codes.
