# KEVIRIO RC1 Deployment Guide

This guide covers the post-push Preview release gate. Missing Preview configuration is not a commit blocker. This guide does not authorize a Production deployment.

## 1. Build contract

- Install with `npm ci` from the committed lockfile.
- Validate with `npm run build`.
- Build output is `dist/` and must not be committed.
- Vite uses root-relative hashed assets under `/assets/`.
- `vercel.json` checks filesystem routes first and then sends unmatched paths to `/index.html` for SPA deep links.

## 2. Required environment variables

Values must be entered through the Vercel environment UI or an approved secret-management flow. Never commit values.

| Name | Development | Preview | Production | Boundary | Audited Vercel state |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Required | Required | Required | Browser-public URL | Missing |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Required | Required | Required | Browser publishable key | Missing |
| `SUPABASE_URL` | Required for server API | Required | Required | Server | Missing |
| `SUPABASE_SECRET_KEY` | Required for server API | Required | Required | Server-only | Missing |
| `KEVIRIO_ALLOWED_ORIGIN` | Required for protected API calls | Required; exact Preview origin | Required; exact Production origin | Server | Missing |

## 3. Conditional environment variables

| Group | Requirement | Default/release rule | Audited Vercel state |
|---|---|---|---|
| `OAUTH_TOKEN_ENCRYPTION_KEY`, `OAUTH_REDIRECT_BASE_URL` | Required only for approved OAuth flow | Keep OAuth disabled until configured | Missing |
| Google/Canva client credentials | OAuth only | Server-only | Missing |
| Provider API keys | Provider runtime only | Presence must not enable execution | Missing |
| `EXTERNAL_EXECUTION_ENABLED` and provider switches | Optional because code fails closed | Explicit `false` recommended | Missing |
| Google capability switches | Optional because code fails closed | Explicit `false` recommended | Missing |
| Cost/token budgets | Optional defaults exist | Set approved bounded values before runtime enablement | Missing |
| `VITE_DEVELOPER_MODE` | Optional | Omit or set `false`; never enable in Production | Missing |
| Basic Auth variables | Optional perimeter | Configure only if deployment policy requires it | Missing |

No local value is copied by this guide. Local audits report required core variables present, but Vercel environment parity is not established.

## 4. Preview procedure after Owner-approved commit

1. Push only the current development branch after explicit approval.
2. Link the intended Vercel project and verify project identity without deploying Production.
3. Add the required Preview variables through Vercel secret management.
4. Keep all execution and capability switches false.
5. Confirm the Preview build uses `npm ci` and `npm run build`.
6. Record the immutable Preview URL and deployment commit SHA.
7. Execute `RC1_POST_DEPLOY_VALIDATION.md`.

## 5. Routing and caching

- Required checks: `/`, all ten canonical destinations, a deep-link refresh, legacy redirects and an unknown path.
- API files under `/api` must win before SPA fallback because `filesystem` is the first route handler.
- Custom cache headers are **Not Implemented**. Vercel's default hashed-asset behavior applies until an explicit reviewed policy is added.

## 6. Production restriction

Do not promote Preview to Production without a new Owner approval after browser, security, environment and rollback checks pass.
