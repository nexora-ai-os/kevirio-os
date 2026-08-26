# M033 Affiliate write-contract hardening

M033 repairs the invalid PostgreSQL repetition bound introduced by M017 and reused by M025. PostgreSQL rejects `{1,1990}` at execution time (`2201B`), so valid Owner-entered A8 tracking URLs cannot reach canonical state.

The new contract accepts only non-empty `http`/`https` URLs with a hostname, no whitespace/control characters, and at most 2,000 characters. Query strings, `+`, `%` encoding, and A8 tracking paths remain byte-for-byte unchanged. Empty input remains `NULL / NOT_REGISTERED`; Unknown is never converted to zero.

The authenticated browser grant on the four-argument M025 RPC is removed. Its six-argument M033 successor performs Owner/workspace authorization, URL/status validation, row locking, exact `updated_at` plus `business_version` comparison, mutation, version increment, and safe audit metadata in one transaction. This removes the client-preflight TOCTOU window without broadening table DML.

M033 changes no M001–M032 file, Revenue, Evidence, Actual, Paid AI, provider, or External Execution contract. Recovery snapshots schema definitions and ACL only; no business rows or secrets are copied. Production apply remains Owner-gated.
