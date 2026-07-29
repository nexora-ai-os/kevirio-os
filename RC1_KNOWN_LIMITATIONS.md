# KEVIRIO RC1 Known Limitations

## Known risks and post-commit release gates

1. `npm audit --omit=dev` reports two High findings through `react-router-dom@7.18.2` / `react-router@7.18.2` for an RSC Mode CSRF issue. KEVIRIO is a Vite SPA, contains no React Server Components or RSC action routes, and uses `BrowserRouter`; the risk is documented and is not a commit blocker under the Owner decision. The offered automatic fix is a breaking downgrade and was not applied.
2. The local Vercel audit reports the project unlinked and Development/Preview/Production environment-variable inventories empty. Preview configuration is a post-push release gate.
3. Authenticated browser screenshots, console inspection, keyboard traversal and visual reflow are post-deployment release gates.

## Product limitations

- Inbox Production repository/data source: None. The screen intentionally shows an unconnected empty state.
- Settings mutation contracts: None. Unsupported controls are omitted.
- Approval hold lifecycle: deferred because the current one-time decision/storage semantics are ambiguous.
- Audit export, search and pagination: Not Implemented.
- AI Employee URL-filter/detail-tab behavior: Not Implemented where no explicit safe contract exists.
- Drawer and Toast: Not Implemented because no canonical use requires them.
- Google Operations remains Dry Run. External Execution remains locked.
- Provider presence or local credential validity does not mean Production operational readiness.

## Operational limitations

- Live application of migrations 010–012 in the target Production database: Unknown.
- Target provider OAuth authorization and quota state: Unknown until environment-specific verification.
- Custom Vercel cache-header policy: None.
- Package version is prepared as `1.0.0-rc.1`; no Git tag or GitHub Release exists or is authorized.

## Repository limitations

- Legacy/Mock source files remain in the repository for historical/test compatibility, but are unreachable from the Production client entry and excluded by tree shaking.
- `docs/audit.zip.zip` is an untracked, unreferenced file of unknown provenance. It is excluded from the intended release set and was not deleted.
- Provider audit/health JSON reports are tracked generated evidence and may describe an earlier observation time; verify freshness before a later release commit.
