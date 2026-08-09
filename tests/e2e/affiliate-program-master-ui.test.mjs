import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../../src/components/affiliate-v2/AffiliateProgramMaster.jsx",import.meta.url),"utf8");
test("Affiliate Intelligence exposes the canonical Program Master fields and compliance detail",()=>{for(const label of ["Program Name","Advertiser","ASP","Category","Reward","EPC","Approval Rate","Program Status","Affiliate Link","Listing Compliance","リスティングNGワード","確認状態","Source","確認日時"])assert.ok(source.includes(label));assert.match(source,/program\.listingNgWords === null \? <p role="status">未確認<\/p>/);assert.doesNotMatch(source,/NGワードなし/);});
test("Affiliate URL editor is explicit, owner-scoped through service, and does not display full URLs in the list",()=>{assert.match(source,/http\/https only/);assert.match(source,/onSaveLink\(program\.id/);const tableSource=source.slice(source.indexOf("const columns"),source.indexOf("return <section"));assert.doesNotMatch(tableSource,/affiliateUrl/);});
