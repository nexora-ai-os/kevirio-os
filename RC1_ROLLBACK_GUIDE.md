# KEVIRIO RC1 Rollback Guide

Rollback must preserve data, RLS, migrations, Audit and Owner authentication. Never use destructive history rewriting on the shared branch.

## Trigger conditions

- Authentication or Workspace isolation regression.
- Credential/secret exposure.
- Approval, Evidence or Actual Revenue semantic regression.
- External Execution unexpectedly enabled.
- Provider/Cost Guard fail-open behavior.
- Critical route or asset failure across the Preview.

## Before Production promotion

1. Stop validation and mark the Preview rejected.
2. Keep the last approved deployment active.
3. Capture the failing Preview URL, commit SHA, route, timestamp and sanitized error.
4. Fix on the development branch and create a new Preview.
5. Do not mutate or roll back the database for a UI-only failure.

## After an approved commit

Use a normal reviewed revert commit for source rollback:

```text
git revert <approved-rc1-commit-sha>
```

Review the generated revert diff, rerun all release gates and obtain Owner approval before push. Do not use `git reset --hard`, force push or history rewriting.

## Vercel rollback

If a Production promotion is later authorized and fails, select the last known-good immutable deployment in Vercel and request explicit Owner approval before promoting it. Record both deployment identifiers. This guide does not authorize the promotion.

## Database and environment boundaries

- Migrations 010–012 are additive and must not be automatically reversed with the UI.
- Never delete Audit or Revenue records during rollback.
- Restore environment configuration through Vercel's managed settings, never through committed secret files.
- Keep execution switches false throughout incident handling.

## Rollback validation

Rerun authentication, route, deep-link, Approval, Evidence/Actual, Provider credential, Cost Guard, Audit, bundle and browser-console checks before closing the rollback.
