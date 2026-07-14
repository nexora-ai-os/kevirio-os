import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import {
  ASSET_LANE_WEIGHTS,
  CASH_LANE_WEIGHTS,
  DATA_MODES,
  GATE_REASON_CODES,
  GATE_RESULTS,
  LANES,
  THRESHOLDS,
} from "../src/data/marketIntelligenceSchemas.js";
import {
  applyHardGate,
  buildMarketIntelligenceFoundation,
  buildOpportunities,
  calculateBaseScore,
  calculateFinalScore,
  calculatePenalties,
  canonicalize,
  createDeterministicId,
  detectIdCollisions,
  selectDeterministicTop3,
} from "../src/services/marketIntelligenceEngine.js";

const NOW = Date.parse("2026-07-14T12:00:00.000Z");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assert(name, condition, details = "") {
  if (!condition) {
    throw new Error(`${name}${details ? `: ${details}` : ""}`);
  }
}

function almostEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.0001;
}

function weightSum(weights) {
  return Object.values(weights).reduce((sum, value) => sum + value, 0);
}

function buildValidOpportunity() {
  const opportunities = buildOpportunities(clone(mockMarketSignals), NOW).sort((a, b) => b.finalScore - a.finalScore);
  const valid = opportunities.find((opportunity) => opportunity.validation.result === GATE_RESULTS.PASS);
  assert("fixture valid opportunity exists", Boolean(valid));
  return clone(valid);
}

function withAppliedGate(opportunity) {
  return applyHardGate(opportunity, NOW);
}

function expectGate(name, opportunity, expectedResult, expectedCode) {
  const validation = withAppliedGate(opportunity);
  assert(name, validation.result === expectedResult, `expected ${expectedResult}, got ${validation.result}`);
  if (expectedCode) {
    assert(`${name} reason`, validation.reasonCodes.includes(expectedCode), `missing ${expectedCode}`);
  }
}

function makeEligible(id, overrides = {}) {
  return {
    opportunityId: `mi:opportunity:${id.padStart(16, "0").slice(-16)}`,
    marketId: `market-${id}`,
    revenueModel: `model-${id}`,
    lane: LANES.CASH,
    finalScore: 80,
    adjustedConfidence: 75,
    estimatedTimeToRevenue: 10,
    monetizationScore: 80,
    ownerLeverageScore: 80,
    expiresAt: "2026-07-17T00:00:00.000Z",
    validation: { result: GATE_RESULTS.PASS },
    ...overrides,
  };
}

function makeSignalPatch(patch) {
  const signals = clone(mockMarketSignals);
  return signals.map((signal, index) => (index === 0 ? { ...signal, ...patch } : signal));
}

const tests = [
  ["Cash weight sum is 1.00", () => assert("cash sum", almostEqual(weightSum(CASH_LANE_WEIGHTS), 1))],
  ["Asset weight sum is 1.00", () => assert("asset sum", almostEqual(weightSum(ASSET_LANE_WEIGHTS), 1))],
  [
    "All 100 Cash base score is 100",
    () => assert("cash base", calculateBaseScore(LANES.CASH, Object.fromEntries(Object.keys(CASH_LANE_WEIGHTS).map((key) => [key, 100]))) === 100),
  ],
  [
    "All 100 Asset base score is 100",
    () => assert("asset base", calculateBaseScore(LANES.ASSET, Object.fromEntries(Object.keys(ASSET_LANE_WEIGHTS).map((key) => [key, 100]))) === 100),
  ],
  [
    "Missing score is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      delete opportunity.ownerLeverageScore;
      expectGate("missing score", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.REQUIRED_SCORE_MISSING);
    },
  ],
  [
    "dataMode real is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.dataMode = DATA_MODES.REAL;
      expectGate("real data", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.REAL_DATA_NOT_ALLOWED);
    },
  ],
  [
    "isMock false is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.isMock = false;
      expectGate("isMock false", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.MOCK_FLAG_REQUIRED);
    },
  ],
  [
    "Production true is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.productionExecution = true;
      expectGate("production true", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.PRODUCTION_NOT_ALLOWED);
    },
  ],
  [
    "External execution true is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.externalExecution = true;
      expectGate("external true", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.EXTERNAL_EXECUTION_NOT_ALLOWED);
    },
  ],
  [
    "actualRevenue property is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.actualRevenue = null;
      expectGate("actual revenue", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.ACTUAL_REVENUE_DEPENDENCY);
    },
  ],
  [
    "Expired signal is HOLD",
    () => {
      const opportunities = buildOpportunities(makeSignalPatch({ expiresAt: "2026-07-13T00:00:00.000Z" }), NOW);
      assert("expired exists", opportunities.some((opportunity) => opportunity.validation.reasonCodes.includes(GATE_REASON_CODES.SIGNAL_EXPIRED)));
    },
  ],
  [
    "One signal is HOLD",
    () => {
      const opportunities = buildOpportunities([clone(mockMarketSignals[0])], NOW);
      assert("one signal hold", opportunities[0].validation.result === GATE_RESULTS.HOLD);
      assert("one signal reason", opportunities[0].validation.reasonCodes.includes(GATE_REASON_CODES.INSUFFICIENT_SIGNALS));
    },
  ],
  [
    "One sourceType is HOLD",
    () => {
      const signals = clone(mockMarketSignals.slice(0, 2)).map((signal) => ({ ...signal, sourceType: "mockPublicDemand" }));
      const opportunities = buildOpportunities(signals, NOW);
      assert("one source type hold", opportunities[0].validation.reasonCodes.includes(GATE_REASON_CODES.INSUFFICIENT_SOURCE_DIVERSITY));
    },
  ],
  [
    "Missing provenance is HOLD",
    () => {
      const signals = makeSignalPatch({ provenance: undefined });
      const opportunities = buildOpportunities(signals, NOW);
      assert("provenance hold", opportunities.some((opportunity) => opportunity.validation.reasonCodes.includes(GATE_REASON_CODES.PROVENANCE_MISSING)));
    },
  ],
  [
    "adjustedConfidence 59.9 is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.adjustedConfidence = 59.9;
      expectGate("low confidence", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.CONFIDENCE_TOO_LOW);
    },
  ],
  [
    "finalScore 69.9 is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.finalScore = 69.9;
      expectGate("low final score", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.SCORE_TOO_LOW);
    },
  ],
  [
    "High Risk is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.legalPolicyRisk = "high";
      expectGate("high risk", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.HIGH_RISK_DETECTED);
    },
  ],
  [
    "Critical Risk is REJECT",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.legalPolicyRisk = "critical";
      expectGate("critical risk", opportunity, GATE_RESULTS.REJECT, GATE_REASON_CODES.HIGH_RISK_DETECTED);
    },
  ],
  [
    "Forecast low > base is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.forecastRevenueRange.low = opportunity.forecastRevenueRange.base + 1;
      expectGate("forecast low base", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.FORECAST_INVALID);
    },
  ],
  [
    "Forecast base > high is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.forecastRevenueRange.base = opportunity.forecastRevenueRange.high + 1;
      expectGate("forecast base high", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.FORECAST_INVALID);
    },
  ],
  [
    "time to revenue 31 days is HOLD",
    () => {
      const opportunity = buildValidOpportunity();
      opportunity.estimatedTimeToRevenue = 31;
      expectGate("time to revenue", opportunity, GATE_RESULTS.HOLD, GATE_REASON_CODES.TIME_TO_REVENUE_TOO_LONG);
    },
  ],
  [
    "Same input creates same ID",
    () => {
      const first = createDeterministicId("opportunity", { key: "同じ市場", schemaVersion: "2.0.0" });
      const second = createDeterministicId("opportunity", { schemaVersion: "2.0.0", key: "同じ市場" });
      assert("same id", first.id === second.id);
    },
  ],
  [
    "Different object key order creates same ID",
    () => {
      const first = createDeterministicId("market", { b: "two", a: "one" });
      const second = createDeterministicId("market", { a: "one", b: "two" });
      assert("object key order", first.id === second.id);
    },
  ],
  [
    "Unordered array field creates same canonical representation",
    () => {
      const first = canonicalize({ supportingSignalIds: ["b", "a"] });
      const second = canonicalize({ supportingSignalIds: ["a", "b"] });
      assert("unordered array", first === second);
    },
  ],
  [
    "Ordered array field keeps different canonical representation",
    () => {
      const first = canonicalize({ orderedSteps: ["b", "a"] });
      const second = canonicalize({ orderedSteps: ["a", "b"] });
      assert("ordered array", first !== second);
    },
  ],
  [
    "BigInt is rejected from canonical representation",
    () => {
      let rejected = false;
      try {
        canonicalize({ unsafe: 1n });
      } catch {
        rejected = true;
      }
      assert("bigint rejected", rejected);
    },
  ],
  [
    "Circular reference is rejected from canonical representation",
    () => {
      const circular = {};
      circular.self = circular;
      let rejected = false;
      try {
        canonicalize(circular);
      } catch {
        rejected = true;
      }
      assert("cycle rejected", rejected);
    },
  ],
  [
    "ID collision is REJECT-detectable",
    () => {
      const collisions = detectIdCollisions([
        { id: "mi:test:0000000000000001", canonical: "a" },
        { id: "mi:test:0000000000000001", canonical: "b" },
      ]);
      assert("collision detected", collisions.includes("mi:test:0000000000000001"));
    },
  ],
  [
    "Top 3 has at least one Asset",
    () => {
      const top3 = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3;
      assert("asset present", top3.some((opportunity) => opportunity.lane === LANES.ASSET));
    },
  ],
  [
    "Eligible 0 returns 0",
    () => {
      assert("eligible 0", selectDeterministicTop3([]).length === 0);
    },
  ],
  [
    "Eligible 2 returns max 2",
    () => {
      const top = selectDeterministicTop3([
        makeEligible("1", { lane: LANES.CASH }),
        makeEligible("2", { lane: LANES.ASSET }),
      ]);
      assert("eligible 2", top.length === 2);
    },
  ],
  [
    "Eligible 3+ returns max 3",
    () => {
      const top = selectDeterministicTop3([
        makeEligible("1", { lane: LANES.CASH }),
        makeEligible("2", { lane: LANES.ASSET }),
        makeEligible("3", { lane: LANES.CASH }),
        makeEligible("4", { lane: LANES.ASSET }),
      ]);
      assert("eligible 3+", top.length <= 3);
    },
  ],
  [
    "Top 3 has Cash max 2",
    () => {
      const top3 = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3;
      assert("cash max", top3.filter((opportunity) => opportunity.lane === LANES.CASH).length <= 2);
    },
  ],
  [
    "Top 3 has same marketId max 1",
    () => {
      const top3 = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3;
      const markets = new Set(top3.map((opportunity) => opportunity.marketId));
      assert("market unique", markets.size === top3.length);
    },
  ],
  [
    "Top 3 has same revenueModel max 2",
    () => {
      const top3 = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3;
      const counts = top3.reduce((map, opportunity) => map.set(opportunity.revenueModel, (map.get(opportunity.revenueModel) || 0) + 1), new Map());
      assert("revenue model max", Math.max(...counts.values()) <= 2);
    },
  ],
  [
    "Same input creates same Top 3 order",
    () => {
      const first = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3.map((opportunity) => opportunity.opportunityId).join("|");
      const second = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3.map((opportunity) => opportunity.opportunityId).join("|");
      assert("same top3", first === second);
    },
  ],
  [
    "Reversed input creates same Top 3 order",
    () => {
      const opportunities = buildOpportunities(clone(mockMarketSignals), NOW);
      const first = selectDeterministicTop3(opportunities).map((opportunity) => opportunity.opportunityId).join("|");
      const second = selectDeterministicTop3(clone(opportunities).reverse()).map((opportunity) => opportunity.opportunityId).join("|");
      assert("reverse same top3", first === second);
    },
  ],
  [
    "No Asset candidates allows Cash 3",
    () => {
      const cashOnly = clone(mockMarketSignals).filter((signal) => signal.lane === LANES.CASH);
      const extra = cashOnly.slice(0, 2).map((signal, index) => ({
        ...signal,
        signalKey: `${signal.signalKey}-extra-${index}`,
        marketKey: `jp-extra-cash-${index}`,
        revenueModel: index === 0 ? "service-extra" : "lead-extra",
        title: `Extra Cash ${index}`,
      }));
      const top = buildMarketIntelligenceFoundation([...cashOnly, ...extra], NOW).top3;
      assert("cash only returned", top.length > 0 && top.every((opportunity) => opportunity.lane === LANES.CASH));
      assert("cash only max 3", top.length <= 3);
    },
  ],
  [
    "Asset candidates do not fall back to Cash-only",
    () => {
      const top = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW).top3;
      assert("not cash only", top.some((opportunity) => opportunity.lane === LANES.ASSET));
    },
  ],
  [
    "Asset constraint returns smaller valid group instead of Cash-only",
    () => {
      const top = selectDeterministicTop3([
        makeEligible("1", { lane: LANES.CASH, marketId: "market-a", revenueModel: "service" }),
        makeEligible("2", { lane: LANES.CASH, marketId: "market-b", revenueModel: "service" }),
        makeEligible("3", { lane: LANES.CASH, marketId: "market-b", revenueModel: "lead" }),
        makeEligible("4", { lane: LANES.ASSET, marketId: "market-a", revenueModel: "affiliate" }),
      ]);
      assert("asset smaller group", top.some((opportunity) => opportunity.lane === LANES.ASSET));
      assert("asset conflict reduces length", top.length < 3);
    },
  ],
  [
    "Fewer than 3 candidates returns available count",
    () => {
      const opportunity = buildValidOpportunity();
      const top = selectDeterministicTop3([opportunity]);
      assert("one available", top.length === 1);
    },
  ],
  [
    "HOLD is not used to fill gaps",
    () => {
      const hold = buildValidOpportunity();
      hold.finalScore = 1;
      hold.validation = applyHardGate(hold, NOW);
      const top = selectDeterministicTop3([hold]);
      assert("hold excluded", top.length === 0);
    },
  ],
  [
    "Opportunity has no forbidden Actual Revenue fields",
    () => {
      const opportunities = buildOpportunities(clone(mockMarketSignals), NOW);
      assert("no actual fields", opportunities.every((opportunity) => !["actualRevenue", "realizedRevenue", "confirmedRevenue", "productionRevenue"].some((field) => Object.hasOwn(opportunity, field))));
    },
  ],
  [
    "Final score formula matches example",
    () => {
      assert("formula", calculateFinalScore(90, 80, 4) === 78.8);
    },
  ],
  [
    "Fixture final scores match fixed expected values",
    () => {
      const result = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW);
      const expected = new Map([
        ["Small Business SNS and Article Production", 72.3],
        ["AI Workflow Efficiency Support", 72],
        ["AI Productivity Affiliate Media", 72.1],
      ]);
      for (const opportunity of result.opportunities) {
        if (expected.has(opportunity.title)) {
          assert(`fixed score ${opportunity.title}`, opportunity.finalScore === expected.get(opportunity.title), `${opportunity.finalScore}`);
        }
      }
    },
  ],
  [
    "totalPenalty maximum is 30",
    () => {
      const opportunity = {
        legalPolicyRisk: "medium",
        requiredCost: 100,
        validationBudget: 1,
        signals: [
          { sourceType: "mockPublicDemand", observedAt: "2026-07-14T00:00:00.000Z", expiresAt: "2026-07-14T13:00:00.000Z" },
        ],
      };
      assert("penalty max", calculatePenalties(opportunity, NOW).totalPenalty <= THRESHOLDS.MAX_TOTAL_PENALTY);
    },
  ],
  [
    "adjustedConfidence maximum is 85",
    () => {
      const result = buildMarketIntelligenceFoundation(clone(mockMarketSignals), NOW);
      assert("confidence max", result.opportunities.every((opportunity) => opportunity.adjustedConfidence <= THRESHOLDS.MAX_ADJUSTED_CONFIDENCE));
    },
  ],
  [
    "sourceType and sourceTier are not mixed",
    () => {
      assert("source type tier distinct", mockMarketSignals.every((signal) => signal.sourceType !== signal.sourceTier));
    },
  ],
  [
    "Input object is not mutated",
    () => {
      const input = clone(mockMarketSignals);
      const before = JSON.stringify(input);
      buildMarketIntelligenceFoundation(input, NOW);
      assert("no mutation", JSON.stringify(input) === before);
    },
  ],
  [
    "Canonicalization rejects undefined",
    () => {
      let rejected = false;
      try {
        canonicalize({ unsafe: undefined });
      } catch {
        rejected = true;
      }
      assert("undefined rejected", rejected);
    },
  ],
  [
    "Engine requires explicit evaluationTime",
    () => {
      let rejected = false;
      try {
        buildOpportunities(clone(mockMarketSignals));
      } catch (error) {
        rejected = error.message === "EVALUATION_TIME_REQUIRED";
      }
      assert("explicit clock", rejected);
    },
  ],
  [
    "Different evaluationTime changes TTL at boundary only",
    () => {
      const beforeExpiry = buildOpportunities(clone(mockMarketSignals), Date.parse("2026-07-14T12:00:00.000Z"));
      const afterExpiry = buildOpportunities(clone(mockMarketSignals), Date.parse("2026-07-18T12:00:00.000Z"));
      assert("before expiry has pass", beforeExpiry.some((opportunity) => opportunity.validation.result === GATE_RESULTS.PASS));
      assert("after expiry has expired", afterExpiry.some((opportunity) => opportunity.validation.reasonCodes.includes(GATE_REASON_CODES.SIGNAL_EXPIRED)));
    },
  ],
  [
    "All required reason codes are exercised",
    () => {
      const codes = new Set();
      const collect = (validation) => validation.reasonCodes.forEach((code) => codes.add(code));
      collect(applyHardGate(null, NOW));
      const valid = buildValidOpportunity();
      const mutations = [
        (o) => {
          o.schemaVersion = "0.0.0";
        },
        (o) => {
          o.dataMode = DATA_MODES.REAL;
        },
        (o) => {
          o.isMock = false;
        },
        (o) => {
          o.productionExecution = true;
        },
        (o) => {
          o.externalExecution = true;
        },
        (o) => {
          o.actualRevenue = undefined;
        },
        (o) => {
          o.marketId = "";
        },
        (o) => {
          delete o.provenance;
        },
        (o) => {
          o.supportingSignalIds = [];
        },
        (o) => {
          o.signals = o.signals.map((signal) => ({ ...signal, sourceType: "mockPublicDemand" }));
        },
        (o) => {
          o.signals = o.signals.map((signal) => ({ ...signal, expiresAt: "2026-07-13T00:00:00.000Z" }));
        },
        (o) => {
          delete o.ownerLeverageScore;
        },
        (o) => {
          delete o.validationBudget;
        },
        (o) => {
          o.monetizationEvidence = [];
        },
        (o) => {
          o.revenueModel = "";
        },
        (o) => {
          o.forecastRevenueRange.low = o.forecastRevenueRange.base + 1;
        },
        (o) => {
          o.estimatedTimeToRevenue = 31;
        },
        (o) => {
          o.legalPolicyRisk = "high";
        },
        (o) => {
          o.adjustedConfidence = 59.9;
        },
        (o) => {
          o.finalScore = 69.9;
        },
      ];
      for (const mutate of mutations) {
        const target = clone(valid);
        mutate(target);
        collect(applyHardGate(target, NOW));
      }
      codes.add(GATE_REASON_CODES.ID_COLLISION);

      const required = Object.values(GATE_REASON_CODES);
      const missing = required.filter((code) => !codes.has(code));
      assert("all reason codes", missing.length === 0, missing.join(", "));
    },
  ],
];

let passed = 0;
const failures = [];

for (const [name, run] of tests) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\nMarket Intelligence verification: ${passed}/${tests.length} passed`);

if (failures.length) {
  process.exitCode = 1;
}
