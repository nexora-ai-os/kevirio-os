import fs from "node:fs/promises";
import {
  createMarketDecision,
  getDecisionStorageKey,
  getMarketDecisionForOpportunity,
  loadMarketDecisions,
  saveMarketDecision,
  validateMarketDecision,
} from "../src/services/marketDecisionService.js";

const STORAGE_KEY = "kevirio:market-decisions:v2";
const DECIDED_AT = "2026-07-15T00:00:00.000Z";
const DECIDED_LATER = "2026-07-15T01:00:00.000Z";

class FakeStorage {
  constructor(initial = {}) {
    this.store = { ...initial };
    this.writes = 0;
    this.failWrite = false;
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    if (this.failWrite) throw new Error("quota exceeded");
    this.writes += 1;
    this.store[key] = value;
  }
}

function assert(name, condition, details = "") {
  if (!condition) {
    throw new Error(`${name}${details ? `: ${details}` : ""}`);
  }
}

function baseInput(overrides = {}) {
  return {
    opportunityId: "mi:opportunity:sample",
    opportunityVersion: "v1",
    marketId: "mi:market:sample",
    correlationId: "mi:market:sample",
    decision: "approved",
    reasonCode: "OWNER_SELECTED_FOR_MOCK_CAMPAIGN",
    decidedAt: DECIDED_AT,
    ...overrides,
  };
}

function makeDecision(overrides = {}) {
  return createMarketDecision(baseInput(overrides), overrides.decidedAt || DECIDED_AT);
}

function validWorkspace(decision = makeDecision()) {
  return {
    schemaVersion: "2.0.0",
    dataMode: "mock",
    workspaceOnly: true,
    decisionsByOpportunityVersion: {
      [getDecisionStorageKey(decision.opportunityId, decision.opportunityVersion)]: decision,
    },
  };
}

function storageWithWorkspace(workspace) {
  return new FakeStorage({ [STORAGE_KEY]: JSON.stringify(workspace) });
}

async function readSource(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), "utf8");
}

const tests = [
  ["Empty storage loads safe empty workspace", () => {
    const result = loadMarketDecisions(new FakeStorage());
    assert("ok", result.ok === true);
    assert("empty", result.storageStatus === "empty");
    assert("schema", result.workspace.schemaVersion === "2.0.0");
    assert("no decisions", Object.keys(result.workspace.decisionsByOpportunityVersion).length === 0);
  }],
  ["Valid workspace loads ready", () => {
    const result = loadMarketDecisions(storageWithWorkspace(validWorkspace()));
    assert("ready", result.ok === true && result.storageStatus === "ready");
  }],
  ["Broken JSON fails closed", () => {
    const storage = new FakeStorage({ [STORAGE_KEY]: "{broken" });
    const result = loadMarketDecisions(storage);
    assert("fail", result.ok === false && result.storageStatus === "corrupted");
    assert("empty fallback", Object.keys(result.workspace.decisionsByOpportunityVersion).length === 0);
  }],
  ["Schema mismatch fails closed", () => {
    const workspace = validWorkspace();
    workspace.schemaVersion = "1.0.0";
    assert("schema fail", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["Real dataMode fails closed", () => {
    const workspace = validWorkspace();
    workspace.dataMode = "real";
    assert("real fail", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["workspaceOnly false fails closed", () => {
    const workspace = validWorkspace();
    workspace.workspaceOnly = false;
    assert("workspace fail", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["Missing decisions object fails closed", () => {
    const workspace = validWorkspace();
    delete workspace.decisionsByOpportunityVersion;
    assert("object fail", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["Decision required field missing fails validation", () => {
    const decision = makeDecision();
    delete decision.marketId;
    assert("field fail", validateMarketDecision(decision).valid === false);
  }],
  ["isMock false fails validation", () => {
    assert("mock fail", validateMarketDecision({ ...makeDecision(), isMock: false }).valid === false);
  }],
  ["Production true fails validation", () => {
    assert("production fail", validateMarketDecision({ ...makeDecision(), productionExecution: true }).valid === false);
  }],
  ["External true fails validation", () => {
    assert("external fail", validateMarketDecision({ ...makeDecision(), externalExecution: true }).valid === false);
  }],
  ["approvalConfirmed true fails validation", () => {
    assert("approval fail", validateMarketDecision({ ...makeDecision(), approvalConfirmed: true }).valid === false);
  }],
  ["campaignHandoffCreated true fails validation", () => {
    assert("handoff fail", validateMarketDecision({ ...makeDecision(), campaignHandoffCreated: true }).valid === false);
  }],
  ["actualRevenue field fails validation", () => {
    assert("actual fail", validateMarketDecision({ ...makeDecision(), actualRevenue: 1 }).valid === false);
  }],
  ["confirmedRevenue field fails validation", () => {
    assert("confirmed fail", validateMarketDecision({ ...makeDecision(), nested: { confirmedRevenue: 1 } }).valid === false);
  }],
  ["Unknown decision fails validation", () => {
    assert("unknown fail", validateMarketDecision({ ...makeDecision(), decision: "maybe" }).valid === false);
  }],
  ["Unknown reasonCode fails validation", () => {
    assert("reason fail", validateMarketDecision({ ...makeDecision(), reasonCode: "OTHER", reasonLabel: "Other" }).valid === false);
  }],
  ["Non-owner decidedBy fails validation", () => {
    assert("owner fail", validateMarketDecision({ ...makeDecision(), decidedBy: "ai" }).valid === false);
  }],
  ["Invalid ISO decidedAt fails validation", () => {
    assert("time fail", validateMarketDecision({ ...makeDecision(), decidedAt: "today" }).valid === false);
  }],
  ["APPROVE creates fixed reason", () => {
    const decision = makeDecision({ decision: "approved", reasonCode: "REVIEW_LATER" });
    assert("reason", decision.reasonCode === "OWNER_SELECTED_FOR_MOCK_CAMPAIGN");
    assert("label", decision.reasonLabel === "Mock Campaign案の作成候補として選択");
  }],
  ["HOLD creates allowed reason", () => {
    const decision = makeDecision({ decision: "hold", reasonCode: "NEEDS_MORE_EVIDENCE" });
    assert("hold", decision.reasonLabel === "根拠を追加確認");
  }],
  ["HOLD defaults to REVIEW_LATER", () => {
    const decision = makeDecision({ decision: "hold", reasonCode: "NOPE" });
    assert("hold default", decision.reasonCode === "REVIEW_LATER");
  }],
  ["REJECT creates allowed reason", () => {
    const decision = makeDecision({ decision: "rejected", reasonCode: "OWNER_EFFORT_TOO_HIGH" });
    assert("reject", decision.reasonLabel === "Owner負荷が大きい");
  }],
  ["REJECT defaults to NOT_STRATEGIC_FIT", () => {
    const decision = makeDecision({ decision: "rejected", reasonCode: "NOPE" });
    assert("reject default", decision.reasonCode === "NOT_STRATEGIC_FIT");
  }],
  ["Same input creates same Decision ID", () => {
    assert("same id", makeDecision().decisionId === makeDecision().decisionId);
  }],
  ["Reason change does not change Decision ID", () => {
    const hold = makeDecision({ decision: "hold", reasonCode: "BUDGET_REVIEW" });
    const reject = makeDecision({ decision: "rejected", reasonCode: "REVENUE_PATH_WEAK" });
    assert("stable id", hold.decisionId === reject.decisionId);
  }],
  ["Decision change does not change Decision ID", () => {
    const approved = makeDecision({ decision: "approved" });
    const hold = makeDecision({ decision: "hold" });
    assert("stable id", approved.decisionId === hold.decisionId);
  }],
  ["Opportunity Version changes Decision ID", () => {
    assert("version id", makeDecision({ opportunityVersion: "v1" }).decisionId !== makeDecision({ opportunityVersion: "v2" }).decisionId);
  }],
  ["Opportunity ID changes Decision ID", () => {
    assert("opportunity id", makeDecision({ opportunityId: "mi:opportunity:other" }).decisionId !== makeDecision().decisionId);
  }],
  ["Storage key uses opportunity and version", () => {
    assert("key", getDecisionStorageKey("a", "b") === "a:b");
  }],
  ["Save approved decision writes storage", () => {
    const storage = new FakeStorage();
    const result = saveMarketDecision(storage, baseInput());
    assert("save ok", result.ok === true && result.saved === true);
    assert("write", storage.writes === 1);
  }],
  ["Saved decision can be loaded after screen reload", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput());
    const loaded = loadMarketDecisions(storage);
    const decision = getMarketDecisionForOpportunity(loaded.workspace, "mi:opportunity:sample", "v1");
    assert("loaded", decision?.decision === "approved");
  }],
  ["Duplicate click replaces same record", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput());
    saveMarketDecision(storage, baseInput({ decidedAt: DECIDED_LATER }));
    const loaded = loadMarketDecisions(storage);
    assert("one record", Object.keys(loaded.workspace.decisionsByOpportunityVersion).length === 1);
  }],
  ["HOLD to APPROVE replaces same record", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput({ decision: "hold", reasonCode: "REVIEW_LATER" }));
    saveMarketDecision(storage, baseInput({ decision: "approved", decidedAt: DECIDED_LATER }));
    const decision = getMarketDecisionForOpportunity(loadMarketDecisions(storage).workspace, "mi:opportunity:sample", "v1");
    assert("approved", decision.decision === "approved");
    assert("later", decision.decidedAt === DECIDED_LATER);
  }],
  ["REJECT to HOLD replaces same record", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput({ decision: "rejected", reasonCode: "NOT_STRATEGIC_FIT" }));
    saveMarketDecision(storage, baseInput({ decision: "hold", reasonCode: "BUDGET_REVIEW" }));
    const decision = getMarketDecisionForOpportunity(loadMarketDecisions(storage).workspace, "mi:opportunity:sample", "v1");
    assert("hold", decision.decision === "hold" && decision.reasonCode === "BUDGET_REVIEW");
  }],
  ["Different Opportunity Version keeps separate decision", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput({ opportunityVersion: "v1" }));
    saveMarketDecision(storage, baseInput({ opportunityVersion: "v2" }));
    assert("two", Object.keys(loadMarketDecisions(storage).workspace.decisionsByOpportunityVersion).length === 2);
  }],
  ["Different market does not overwrite when opportunity differs", () => {
    const storage = new FakeStorage();
    saveMarketDecision(storage, baseInput({ opportunityId: "mi:opportunity:a", marketId: "mi:market:a" }));
    saveMarketDecision(storage, baseInput({ opportunityId: "mi:opportunity:b", marketId: "mi:market:b" }));
    assert("two markets", Object.keys(loadMarketDecisions(storage).workspace.decisionsByOpportunityVersion).length === 2);
  }],
  ["Corrupted data is not silently overwritten on save", () => {
    const storage = new FakeStorage({ [STORAGE_KEY]: "{broken" });
    const result = saveMarketDecision(storage, baseInput());
    assert("not saved", result.ok === false && storage.writes === 0);
  }],
  ["Storage quota error returns save_failed", () => {
    const storage = new FakeStorage();
    storage.failWrite = true;
    const result = saveMarketDecision(storage, baseInput());
    assert("quota", result.ok === false && result.storageStatus === "save_failed");
  }],
  ["50 decisions are allowed", () => {
    const storage = new FakeStorage();
    for (let index = 0; index < 50; index += 1) {
      const result = saveMarketDecision(storage, baseInput({ opportunityId: `mi:opportunity:${index}` }));
      assert(`save ${index}`, result.ok === true);
    }
    assert("count 50", Object.keys(loadMarketDecisions(storage).workspace.decisionsByOpportunityVersion).length === 50);
  }],
  ["51st decision fails closed", () => {
    const storage = new FakeStorage();
    for (let index = 0; index < 50; index += 1) {
      saveMarketDecision(storage, baseInput({ opportunityId: `mi:opportunity:${index}` }));
    }
    const result = saveMarketDecision(storage, baseInput({ opportunityId: "mi:opportunity:51" }));
    assert("limit", result.ok === false && result.storageStatus === "limit_exceeded");
    assert("still 50", Object.keys(loadMarketDecisions(storage).workspace.decisionsByOpportunityVersion).length === 50);
  }],
  ["Replacing within 50 limit still works", () => {
    const storage = new FakeStorage();
    for (let index = 0; index < 50; index += 1) {
      saveMarketDecision(storage, baseInput({ opportunityId: `mi:opportunity:${index}` }));
    }
    const result = saveMarketDecision(storage, baseInput({ opportunityId: "mi:opportunity:49", decision: "hold" }));
    assert("replace allowed", result.ok === true);
  }],
  ["Existing handoff true fails closed during load", () => {
    const decision = makeDecision();
    decision.campaignHandoffCreated = true;
    const workspace = validWorkspace(decision);
    assert("handoff corrupted", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["Manual workspace key mismatch fails closed", () => {
    const workspace = validWorkspace();
    workspace.decisionsByOpportunityVersion.other = makeDecision({ opportunityId: "mi:opportunity:other" });
    assert("key mismatch", loadMarketDecisions(storageWithWorkspace(workspace)).ok === false);
  }],
  ["saveMarketDecision rejects invalid input", () => {
    const result = saveMarketDecision(new FakeStorage(), { ...baseInput(), decision: "other" });
    assert("invalid", result.ok === false && result.storageStatus === "invalid");
  }],
  ["createMarketDecision does not mutate input", () => {
    const input = baseInput({ decision: "hold", reasonCode: "BUDGET_REVIEW" });
    const before = JSON.stringify(input);
    createMarketDecision(input, DECIDED_AT);
    assert("mutation", JSON.stringify(input) === before);
  }],
  ["Decision stores no campaign payload", () => {
    const text = JSON.stringify(makeDecision());
    assert("no campaign payload", !text.includes("campaignTitle") && !text.includes("campaignDraft"));
  }],
  ["Decision stores no Ledger append state", () => {
    assert("ledger", makeDecision().ledgerAppend === false);
  }],
  ["Decision stores no Actual Revenue", () => {
    assert("actual", !JSON.stringify(makeDecision()).includes("actualRevenue"));
  }],
  ["Decision stores no Production execution", () => {
    assert("prod", makeDecision().productionExecution === false);
  }],
  ["Decision stores no external execution", () => {
    assert("external", makeDecision().externalExecution === false);
  }],
  ["Decision does not confirm Approval", () => {
    assert("approval", makeDecision().approvalConfirmed === false);
  }],
  ["loadMarketDecisions tolerates missing storage injection", () => {
    const result = loadMarketDecisions(null);
    assert("no storage", result.ok === true && result.storageStatus === "empty");
  }],
  ["saveMarketDecision requires storage writer", () => {
    const result = saveMarketDecision(null, baseInput());
    assert("no writer", result.ok === false && result.storageStatus === "save_failed");
  }],
  ["Service source has no global localStorage reference", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no localStorage", !source.includes("localStorage"));
  }],
  ["Service source has no module load clock", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no Date.now", !source.includes("Date.now("));
    assert("no new Date", !source.includes("new Date()"));
  }],
  ["Service source has no fetch", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no fetch", !source.includes("fetch("));
  }],
  ["Service source has no axios or WebSocket", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no axios", !source.includes("axios"));
    assert("no websocket", !source.includes("WebSocket"));
  }],
  ["Service source has no Campaign import", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no campaign import", !source.includes("campaignEngine") && !source.includes("revenueCampaignService"));
  }],
  ["UI source contains three Owner decision labels", async () => {
    const source = await readSource("../src/components/MarketIntelligence.jsx");
    assert("labels", source.includes("進める") && source.includes("保留") && source.includes("却下"));
  }],
  ["UI source explains Mock Campaign candidate only", async () => {
    const source = await readSource("../src/components/MarketIntelligence.jsx");
    assert("mock copy", source.includes("Mock Campaign案"));
  }],
  ["UI source has aria-pressed", async () => {
    const source = await readSource("../src/components/MarketIntelligence.jsx");
    assert("aria pressed", source.includes("aria-pressed"));
  }],
  ["UI source has aria-live", async () => {
    const source = await readSource("../src/components/MarketIntelligence.jsx");
    assert("aria live", source.includes("aria-live"));
  }],
  ["UI source has alert for save failure", async () => {
    const source = await readSource("../src/components/MarketIntelligence.jsx");
    assert("alert", source.includes("role=\"alert\""));
  }],
  ["UI source uses the required storage key", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("storage key", source.includes(STORAGE_KEY));
  }],
  ["Adapter enables Owner Decision", async () => {
    const source = await readSource("../src/services/marketIntelligenceAdapter.js");
    assert("owner true", source.includes("ownerDecisionEnabled: true"));
  }],
  ["Adapter keeps Campaign Handoff disabled", async () => {
    const source = await readSource("../src/services/marketIntelligenceAdapter.js");
    assert("handoff false", source.includes("campaignHandoffEnabled: false"));
  }],
  ["Adapter keeps Production disabled", async () => {
    const source = await readSource("../src/services/marketIntelligenceAdapter.js");
    assert("prod false", source.includes("productionExecution: false"));
  }],
  ["No score recalculation in Decision Service", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no score", !source.includes("finalScore") && !source.includes("baseScore") && !source.includes("totalPenalty"));
  }],
  ["No ranking reselection in Decision Service", async () => {
    const source = await readSource("../src/services/marketDecisionService.js");
    assert("no ranking", !source.includes("top3") && !source.includes("rank"));
  }],
];

let passed = 0;
const failures = [];

for (const [name, run] of tests) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\nMarket Decision verification: ${passed}/${tests.length} passed`);

if (failures.length) {
  process.exitCode = 1;
}
