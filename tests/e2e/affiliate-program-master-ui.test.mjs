import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../../src/components/affiliate-v2/AffiliateProgramMaster.jsx",import.meta.url),"utf8");
test("Affiliate Intelligence exposes canonical Program Master and compliance detail",()=>{for(const label of["Program Name","Advertiser","ASP","Category","Reward","EPC","Approval Rate","Program Status","Affiliate Link","Listing Compliance","掲載NGワード","確認状態","Source","確認日時"])assert.ok(source.includes(label));assert.match(source,/program\.listingNgWords===null\?<p role="status">未確認<\/p>/)});
test("Affiliate URL editor is explicit, owner-scoped, and omits full URLs from the list",()=>{assert.match(source,/http\/https only/);assert.match(source,/onSaveLink\(program\.id/);const tableSource=source.slice(source.indexOf("const columns"),source.indexOf("return <section"));assert.doesNotMatch(tableSource,/affiliateUrl/)});
test("Affiliate Program Master exposes edit pause resume archive and exact snapshot input",()=>{for(const label of["案件を編集","変更を保存","Pause","Resume","Archive","expectedUpdatedAt:program.updatedAt","External Execution","LOCKED"])assert.ok(source.includes(label))});
test("M027 operational fields use draft autosave and protected optimistic RPC callbacks",()=>{for(const value of["下書き保存済み","expectedDraftVersion:draftVersion","expectedBusinessVersion:program.businessVersion","AI提案はDRAFT","Actual Revenue・Evidence"])assert.ok(source.includes(value))});
