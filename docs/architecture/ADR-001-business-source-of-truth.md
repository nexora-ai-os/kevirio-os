# ADR-001: Business Source of Truth

Decision: Supabase PostgreSQL is the canonical Business Source of Truth. localStorage is limited to non-confidential UI preferences and temporary drafts. Reason: reload/device durability, constraints, RLS and auditable revenue truth.
