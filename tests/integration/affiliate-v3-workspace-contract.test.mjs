import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const experience=await readFile(new URL("../../src/components/affiliate-v2/AffiliateV2Experience.jsx",import.meta.url),"utf8");
const panels=await readFile(new URL("../../src/components/affiliate-v2/AffiliateV2Panels.jsx",import.meta.url),"utf8");
test("V3 reuses the premium command center and provides complete program workspaces",()=>{for(const view of ["strategy","publication","evidence","revenue","learning"])assert.match(experience,new RegExp(`\\b${view}\\b`));assert.match(experience,/PROGRAM WORKSPACE/);assert.match(experience,/OwnerDecisionRail/)});
test("publication stays manual and revenue stays evidence backed",()=>{assert.match(panels,/Publication Workspace/);assert.match(panels,/Owner Approval後も公開は手動/);assert.match(panels,/External Execution: LOCKED/);assert.match(panels,/Revenue Workspace/);assert.match(panels,/ForecastとActualは合算しません/)});
