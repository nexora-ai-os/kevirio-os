import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const assistant = readFileSync(new URL("../../src/components/next/NextDurableAssistant.jsx", import.meta.url), "utf8"), card = readFileSync(new URL("../../src/components/next/AiCapabilityCard.jsx", import.meta.url), "utf8"), policy = readFileSync(new URL("../../src/services/aiRealOperations.js", import.meta.url), "utf8"), workspace = readFileSync(new URL("../../src/components/next/NextWorkspace.jsx", import.meta.url), "utf8");
test("one consistent AI response exposes provider cost timestamp basis and actions", () => { for (const value of ["Provider", "Cost", "Timestamp", "Data basis", "コピー", "再生成準備", "関連画面を開く"]) assert.ok(assistant.includes(value)); });
test("area capability stays FREE_ONLY PERSONAL_PRIVATE and externally locked", () => { for (const value of ["FREE_ONLY", "Unknown ≠ 0", "Forecast ≠ Actual", "AI ≠ Evidence", "LOCKED"]) assert.ok(card.includes(value)); assert.ok(policy.includes("PERSONAL_PRIVATE")); assert.ok(workspace.includes("AiCapabilityCard")); });
