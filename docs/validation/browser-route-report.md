# Authenticated Browser Route Report

Date: 2026-08-02
Environment: Windows native Playwright Chromium, authenticated active Owner Session
Result: **PASS**

Routes validated: Home, AI Employees, Approvals, Operations, Revenue, Insights, Integrations, Inbox, Audit and Settings.

Checks: Owner verification, route render, h1/main landmarks, active application shell, reload, deep link, back/forward history, loading completion, no page-level overflow, mojibake, raw UUID or credential-like rendered content. Console errors: 0. Uncaught page errors: 0. Critical failed requests: 0.

Authentication was performed directly by the Owner. The storage state is under ignored `playwright/.auth/owner.json`; its contents were not printed, copied into reports or staged.
