import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const app=await readFile(new URL("../../src/App.jsx",import.meta.url),"utf8");
const experience=await readFile(new URL("../../src/components/affiliate-v2/AffiliateV2Experience.jsx",import.meta.url),"utf8");
test("affiliate V2 remains route-lazy and offer routes retain the saved workspace contract",()=>{assert.match(app,/lazy\(\(\)\s*=>\s*import\("\.\/components\/affiliate-v2\/AffiliateV2Experience\.jsx"\)\)/);assert.match(experience,/operations\/offers/)});
test("saved navigation surfaces remain present",()=>{for(const view of ["product","strategy","content","evidence","learning","graph","ai-meeting","audit"])assert.match(experience,new RegExp(`"${view}"`))});
