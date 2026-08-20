# KEVIRIO Gemini Runtime Fix Report

## Verdict

`OWNER_RECHECK_REQUIRED`

## Owner Browser Failure

The Owner's real iPad request reached the AI Secretary but displayed `LOCAL / DETERMINISTIC`. The fallback itself stayed safe; paid fallback remained OFF.

## Root Cause

The exact failing stage was the server-side Owner request Origin gate, before the Gemini adapter. `resolveVerifiedOwnerContext` allowed only one configured `KEVIRIO_ALLOWED_ORIGIN`, while the Owner used the canonical Vercel branch alias. Vercel Preview has both the Gemini credential and Origin variable names configured, but sensitive values are intentionally not readable. The prior UI collapsed all safe server reason codes into a generic Gemini fallback message, hiding this distinction.

The fix strictly allowlists the configured Origin plus Vercel-provided `VERCEL_BRANCH_URL` and immutable `VERCEL_URL`. Arbitrary origins remain denied. Gemini/provider errors are now normalized to safe technical states without raw provider payloads.

## Environment

- Canonical alias: `kevirio-os-git-hotfix-v3-revenue-cost-canonical-kevirio.vercel.app`
- Failing release: `3a778cb`
- Credential variable present in Preview: YES
- Origin variable present in Preview: YES
- Diagnostic/runtime same environment before fix: NO. The successful diagnostic used local `.env.local`; the failing Owner request used Vercel Preview.

## Gemini

- Project: `gen-lang-client-0000631541`
- Model: `gemini-2.5-flash`
- Endpoint: Google Generative Language API `v1beta generateContent`
- Request: bounded, one content part, maxOutputTokens 800, timeout 20 seconds, retry 0
- Post-fix Owner-equivalent live test: HTTP 200, Provider Gemini, Mode LIVE AI, exactly 3 priorities
- Quota: AVAILABLE
- Cost: FREE; paid calls 0

## Router

- Primary: Gemini CONNECTED_FREE
- Fallback: LOCAL / DETERMINISTIC
- Paid fallback: OFF
- Fallback used in post-fix live test: NO

## Security

- Syntax: 333/333 PASS
- Unit: 321/321 PASS
- Integration: 177/177 PASS
- E2E: 14/14 PASS
- Source policy: 487 files PASS
- Credential Boundary: 27/27 PASS
- Credential Exposure: 20/20 PASS
- Provider isolation: PASS
- AI privacy: PASS
- Cost Guard: 37/37 PASS
- Provider Platform: 29/29 PASS
- M001-M026 unchanged; M027 not created

## Ready for Owner Recheck

YES. Runtime browser acceptance remains required on the fixed Private Beta deployment.

## Exact Owner Action

On the canonical Private Beta AI Secretary, submit `今日やることを3つに絞って` once and confirm Provider `Gemini`, Mode `LIVE AI`, Cost `FREE`, and three priorities.
