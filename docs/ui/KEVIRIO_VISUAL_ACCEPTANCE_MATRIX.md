# KEVIRIO Visual Acceptance Matrix

## Recovery status

|Screen|Implementation|Desktop|Mobile|Truthful state|
|---|---|---|---|---|
|Home|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Repository only|
|AI Employees|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Dry Run / API calls 0|
|Approvals|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Exact snapshot preserved|
|Operations|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Repository only|
|Revenue|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Actual / Forecast / Evidence separated|
|Insights|Implemented|PASS 1440×900|PASS 390×844 / 360×800|No-data is not rendered as zero|
|Integrations|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Secrets hidden / execution locked|
|Inbox|Implemented|PASS 1440×900|PASS 390×844 / 360×800|No fabricated messages|
|Audit|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Redacted append-only source|
|Settings|Implemented|PASS 1440×900|PASS 390×844 / 360×800|Unsupported controls omitted|

## Required visual checks

- All 10 routes: 1440×900 and 390×844.
- Home: 1920×1080, 768×1024, 200% zoom.
- Check: White/Champagne dominance, Gold K, Japanese-primary copy, no horizontal overflow, visible focus, 44px targets, responsive navigation, Empty/Error/Loading state, no fake metric or action.

Screenshot evidence must only be marked PASS when the corresponding image file exists. Authentication or Browser infrastructure failure is recorded as BLOCKED, never inferred as PASS.

2026-08-02 evidence: 60 authenticated screenshots exist in git-ignored `playwright-artifacts/screenshots/`; index and privacy boundary are documented in `docs/validation/browser-screenshot-index.md`.
