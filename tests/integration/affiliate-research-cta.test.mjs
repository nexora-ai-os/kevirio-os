import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("Affiliate Research readiness keeps EPC and approval rate recommended", async () => {
  const ui = await read("src/components/affiliate-v2/AffiliateProgramMaster.jsx");
  const required = ui.slice(ui.indexOf("missingResearchRequired"), ui.indexOf("missingResearchRecommended"));
  const recommended = ui.slice(ui.indexOf("missingResearchRecommended"), ui.indexOf("export default"));
  assert.doesNotMatch(required, /p\.epc|p\.approvalRate/);
  assert.match(recommended, /p\.epc == null/);
  assert.match(recommended, /p\.approvalRate == null/);
  assert.match(ui, /Research Ready: \{miss\.length \? "NO" : "YES"\}/);
  assert.match(ui, /AIでResearchを開始/);
});

test("Affiliate Research uses exact server-retrieved Program and existing M028 M029 path", async () => {
  const [api, experience] = await Promise.all([
    read("api/ai.js"),
    read("src/components/affiliate-v2/AffiliateV2Experience.jsx"),
  ]);
  assert.match(api, /body\.action === "affiliateResearchGenerate"/);
  assert.match(api, /affiliate_program_master/);
  assert.match(api, /\.eq\("id",body\.programId\)\.eq\("workspace_id",body\.workspaceId\)/);
  assert.match(api, /epc:program\.epc==null\?"UNKNOWN"/);
  assert.match(api, /approval_rate:program\.approval_rate==null\?"UNKNOWN"/);
  assert.match(api, /truthClass:"AI_RECOMMENDATION"/);
  assert.match(api, /evidence_status:"NOT_EVIDENCE"/);
  assert.match(api, /paidAiJpy:0/);
  assert.match(api, /externalExecution:"LOCKED"/);
  assert.match(experience, /executeProtectedResearch/);
  assert.match(experience, /targetType:"AFFILIATE_PROGRAM",targetId:program\.id,relationType:"CREATED_FOR"/);
  assert.match(experience, /loadGlobalIntelligence/);
});
