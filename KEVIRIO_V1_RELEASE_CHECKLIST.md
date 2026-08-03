# KEVIRIO V1 Release Checklist

Version: 1.0.0 Release Candidate
Migration 013 SHA: `B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB`

## Database

- [x] Migration 012 Production Applied and post-smoke PASS
- [ ] Migration 013 pre-check PASS
- [ ] Migration 013 SHA verified in Production session
- [ ] Migration 013 applied exactly once
- [ ] Migration 013 post-smoke PASS
- [x] No Migration 014 or later
- [x] Business Memory isolation, RLS and Workspace boundaries preserved

## Quality

- [x] Build PASS
- [x] Unit 180/180 PASS
- [x] Integration 99/99 PASS
- [x] E2E 3/3 PASS
- [x] Migration 013 static 18/18 PASS
- [x] PostgreSQL parser PASS
- [x] Browser 104/104 PASS — latest authenticated evidence
- [x] Accessibility PASS
- [x] Performance PASS
- [x] Credential Boundary 27/27 PASS
- [x] Credential Exposure 20/20 PASS
- [x] Source policy and `git diff --check` PASS

## Release package

- [x] Release Manifest
- [x] Deployment Runbook
- [x] Operations Runbook
- [x] Rollback Runbook
- [x] Release Notes
- [x] Known Risks
- [x] 30-day Revenue Plan
- [x] V2 backlog isolation

## Git and deployment

- [ ] Intended release scope approved
- [ ] Release Commit created with clean working tree
- [ ] Git Tag `v1.0.0` created
- [ ] Push separately approved and completed
- [ ] Deploy separately approved and completed
- [ ] Deployed commit equals approved release commit
- [ ] Tag points to verified deployed commit

## Production safety and verification

- [ ] Production URL and Vercel project confirmed
- [ ] Supabase Production project confirmed
- [ ] Backup/PITR confirmed
- [ ] Previous known-good deployment recorded
- [ ] Environment verified without exposing values
- [ ] Global and Provider switches confirmed false
- [x] External Execution design state LOCKED
- [ ] `/api/status` health PASS
- [ ] Owner login/reload/logout PASS
- [ ] Ten Production routes PASS
- [ ] Console/network/responsive/data-truth smoke PASS
- [ ] Workspace, Approval, Revenue, Evidence and Cost Guard smoke PASS
- [ ] Provider Health verified without execution
- [ ] Rollback readiness confirmed

## Business readiness

- [x] Revenue Engine definitions
- [x] AI Employee truthful maturity
- [x] Offer, Approval and Manual Execution
- [x] Evidence and Actual Revenue
- [x] Actual Cost and currency-separated Net Profit
- [x] Cost Guard
- [ ] First genuine Production offer selected
- [ ] Owner revenue target and cost ceiling approved

Current state: `NO-GO` until all unchecked Critical database, Git, deployment and Production verification gates are closed.
