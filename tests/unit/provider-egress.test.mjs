import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProviderEgress } from "../../src/services/providerDataEgressPolicy.js";

test("allows selected internal mock fields",()=>assert.equal(evaluateProviderEgress({purpose:"directServiceDraft",sensitivityLevel:"internal",selectedFields:{title:"draft"}}).allowed,true));
test("blocks restricted data",()=>assert.equal(evaluateProviderEgress({purpose:"directServiceDraft",sensitivityLevel:"restricted",selectedFields:{title:"secret"}}).reasonCode,"SENSITIVITY_BLOCKED"));
test("blocks credential patterns",()=>assert.equal(evaluateProviderEgress({purpose:"directServiceDraft",sensitivityLevel:"internal",selectedFields:{note:"api_key=should-not-leave"}}).reasonCode,"SECRET_DETECTED"));
test("redacts obvious personal identifiers",()=>assert.equal(evaluateProviderEgress({purpose:"directServiceDraft",sensitivityLevel:"internal",selectedFields:{contact:"owner@example.com"}}).redacted,true));
