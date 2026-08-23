import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/components/affiliate-v2/AffiliateProgramMaster.jsx", import.meta.url),
  "utf8",
);

test("Affiliate Program Master exposes practical canonical detail", () => {
  for (const label of ["Program名", "広告主名", "ASP", "カテゴリ", "報酬種別", "報酬詳細", "EPC", "承認率", "Program ID", "Affiliate URL", "掲載ポリシー", "NGワード", "掲載条件確認状態", "情報源種別", "情報確認日時"])
    assert.ok(source.includes(label), label);
  assert.match(source, /listingNgWords\?\.join/);
});

test("Affiliate URL editor is owner callback scoped and omits full URLs from cards", () => {
  assert.match(source, /type="url"/);
  assert.match(source, /onSaveLink\(program\.id/);
  const cards = source.slice(source.indexOf("av2-program-card-grid"), source.indexOf("function Registration"));
  assert.doesNotMatch(cards, /affiliateUrl/);
});

test("Affiliate Program Master exposes edit pause resume archive delete and exact snapshots", () => {
  for (const label of ["編集", "変更を保存", "Pause", "Resume", "Archive", "Delete", "External Execution", "LOCKED"])
    assert.ok(source.includes(label), label);
  assert.match(source, /expectedUpdatedAt:\s*program\.updatedAt/);
  assert.match(source, /expectedBusinessVersion:\s*program\.businessVersion/);
});

test("M027 and M030 fields use durable draft and protected optimistic callbacks", () => {
  for (const value of ["下書き保存済み", "AI提案はDRAFT", "Actual Revenue", "Evidence", "onUpdatePractical", "onDeleteSafe"])
    assert.ok(source.includes(value), value);
  assert.match(source, /expectedDraftVersion:\s*version/);
  assert.match(source, /expectedBusinessVersion:\s*program\.businessVersion/);
});
