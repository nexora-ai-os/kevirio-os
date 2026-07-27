# OAuth Redirect URI Candidates

These routes are candidates only. Neither callback is implemented or registered by this audit.

| Provider | Local | Production |
|---|---|---|
| Google | `http://127.0.0.1:5173/api/oauth/google/callback` | `https://nexora-os-psi.vercel.app/api/oauth/google/callback` |
| Canva | `http://127.0.0.1:5173/api/oauth/canva/callback` | `https://nexora-os-psi.vercel.app/api/oauth/canva/callback` |

## Proposed minimum Google scopes

Request scopes incrementally per feature, never as one default bundle.

- Identity: `openid`, `email` only when account binding is required.
- Gmail read: `https://www.googleapis.com/auth/gmail.readonly`
- Drive metadata: `https://www.googleapis.com/auth/drive.metadata.readonly`; use `drive.readonly` only if file content is required.
- Calendar read: `https://www.googleapis.com/auth/calendar.readonly`
- Analytics Data: `https://www.googleapis.com/auth/analytics.readonly`
- Search Console: `https://www.googleapis.com/auth/webmasters.readonly`
- YouTube analytics/data read: `https://www.googleapis.com/auth/youtube.readonly`

No write, send, upload, publish, or offline access should be requested until its specific workflow, approval, audit, revocation, and retention controls are implemented.
