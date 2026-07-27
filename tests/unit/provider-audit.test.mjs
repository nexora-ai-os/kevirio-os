import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnvFiles, environmentState, safeResult, markdownReport, buildAudit } from "../../scripts/provider-audit-lib.mjs";

test("environment audit exposes names and redaction only",()=>{const root=mkdtempSync(join(tmpdir(),"provider-audit-"));writeFileSync(join(root,".env.local"),"OPENAI_API_KEY=private-value\nOPENAI_API_KEY=duplicate\n");const defs=parseEnvFiles(root);assert.equal(defs[0].value,"[REDACTED]");assert.equal(JSON.stringify(defs).includes("private-value"),false);assert.equal(defs[0].duplicate,true);});
test("canonical env state records presence without the value",()=>{const state=environmentState([{file:".env.local",name:"GEMINI_API_KEY",nonEmpty:true,duplicate:false}],"gemini");assert.equal(state[0].variable_non_empty,true);assert.equal(Object.hasOwn(state[0],"value"),false);assert.equal(state[0].naming_mismatch,false);});
test("health result cannot carry secrets or execution enablement",()=>{const result=safeResult("openai",{checked:true,connectionResult:"connected",httpStatus:200});assert.equal(result.externalExecution,false);assert.equal(result.secretsExposed,false);assert.equal(JSON.stringify(result).includes("authorization"),false);});
test("audit and markdown keep external execution locked",()=>{const audit=buildAudit({root:mkdtempSync(join(tmpdir(),"provider-audit-"))});assert.equal(audit.externalExecution,"LOCKED");assert.ok(audit.providers.every(v=>v.externalExecution===false));assert.match(markdownReport(audit),/External Execution remains LOCKED/);});
