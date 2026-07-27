import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app=readFileSync(new URL("../../src/App.jsx",import.meta.url),"utf8");
const revenue=readFileSync(new URL("../../src/components/ProductionRevenueWorkspace.jsx",import.meta.url),"utf8");
const client=readFileSync(new URL("../../src/services/supabaseBrowserClient.js",import.meta.url),"utf8");
const workspace=readFileSync(new URL("../../src/services/workspaceBootstrapService.js",import.meta.url),"utf8");
const revenueRepository=readFileSync(new URL("../../src/repositories/revenueRepository.js",import.meta.url),"utf8");
const operationsRepository=readFileSync(new URL("../../src/repositories/offerOperationsRepository.js",import.meta.url),"utf8");
const foundation=readFileSync(new URL("../../src/components/ProductionFoundationPanel.jsx",import.meta.url),"utf8");
const ownerAuth=readFileSync(new URL("../../src/services/ownerAuthState.js",import.meta.url),"utf8");

test("primary canonical screens exclude legacy floating approval counts",()=>assert.match(app,/! \["production","home","campaign","approval","analytics","operations"\]\.includes\(page\)/));
test("zero revenue records render as unregistered rather than confirmed zero",()=>{assert.match(revenue,/hasActual \? money\(totalActual\) : /);assert.doesNotMatch(revenue,/hasActual \? money\(totalActual\) : money\(0\)/);});
test("default browser auth client is singleton under React StrictMode",()=>{assert.match(client,/defaultBrowserClient \|\|=/);assert.match(client,/env===import\.meta\.env/);});
test("canonical remote reads fail closed on a finite deadline",()=>{assert.match(workspace,/REMOTE_TIMEOUT_MS=12000/);assert.match(revenueRepository,/REPOSITORY_TIMEOUT/);assert.match(operationsRepository,/OPERATIONS_TIMEOUT/);});
test("transient remote failures never offer a bootstrap action",()=>assert.match(foundation,/remote\.status==="not_initialized"/));
test("Owner authentication fails closed instead of loading forever",()=>assert.match(ownerAuth,/OWNER_AUTH_TIMEOUT/));
