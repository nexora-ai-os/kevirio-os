# KEVIRIO RC1 Release Checklist

Status date: 2026-07-30  
Candidate version: `1.0.0-rc.1`  
Branch: `feat/revenue-repository-integration-v1`

## Repository

- [x] Git status and diff reviewed.
- [x] No tracked deleted files.
- [x] Ignored runtime artifacts (`.env.local`, `dist`, `.vercel`, logs) remain untracked.
- [x] Two proven orphan CSS files removed.
- [x] Client import graph checked: 176 JS/JSX/CSS source files, 71 reachable from `src/main.jsx`, 0 reachable cycles.
- [x] Legacy/Mock source is excluded from the Production client graph and tree-shaken from the build.
- [x] Route/page keys and Design System exports checked.
- [x] Dependency tree is deduplicated; `npm dedupe --dry-run` reports up to date.
- [x] Package name, RC version, private flag and exact dependency versions recorded.
- [x] Dependency security review complete — `npm audit --omit=dev` reports two High findings limited to React Router RSC Mode; current Vite SPA has no RSC implementation or action routes. Recorded as Known Risk under Owner decision.
- [x] Code validation commit gate passed.
- [x] Intended release files staged; exact staged file list and diff summary generated for Owner review.
- [ ] Owner approval for commit.

## Validation

- [x] Production build.
- [x] Source-policy lint.
- [x] JavaScript syntax validation.
- [x] Unit, integration and E2E suites after final accessibility-test correction.
- [x] Credential Boundary and Credential Exposure.
- [x] Migration foundation.
- [x] Cost Guard, Provider Platform and AI Employee focused suites.
- [x] Route registration and screen-level lazy loading.
- [x] Bundle limit: no raw JS chunk above 500 kB.
- [ ] Authenticated browser visual/console/focus/reflow validation: post-push release gate; not a commit blocker.

## Deployment prerequisites

- [x] `vercel.json` filesystem-first SPA fallback reviewed.
- [x] Root, deep-link, legacy redirect and 404 contracts are automated-test covered.
- [ ] Vercel project link: **Missing locally**; configure after push.
- [ ] Vercel Development environment variables: **Missing in audited project**; not a commit blocker.
- [ ] Vercel Preview environment variables: **Missing in audited project**; post-push release gate.
- [ ] Vercel Production environment variables: **Missing in audited project**; Production release gate.
- [ ] Cache-header policy: **Not configured**.
- [ ] Preview deployment: requires approved commit and push; not started.
- [ ] Production deployment approval: not granted.

## Release stop conditions

Commit gate: code validation and exact staged-diff review. Post-commit gates: push approval, Preview environment, Preview deployment and authenticated browser validation. Do not push before separate approval. Do not deploy Production, merge, tag or create a GitHub Release without separate Owner approval.
