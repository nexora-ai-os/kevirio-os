import test from "node:test";
import assert from "node:assert/strict";
import { createVerifiedRevenueRecord, validateEvidenceCandidate } from "../../src/domain/revenueEvidence.js";

const evidence={id:"e1",workspaceId:"w1",brandId:"b1",campaignId:"c1",sourceType:"invoice_paid",sourceReference:"ref-1",amountMinor:10000,costAmountMinor:2500,currency:"JPY",occurredAt:"2026-07-25T00:00:00.000Z",verificationStatus:"verified",lane:"service",valueType:"actual"};
test("validates integer minor-unit evidence",()=>assert.equal(validateEvidenceCandidate(evidence).valid,true));
test("rejects forecast as actual evidence",()=>assert.equal(validateEvidenceCandidate({...evidence,valueType:"forecast"}).valid,false));
test("calculates net deterministically after verification approval",()=>assert.equal(createVerifiedRevenueRecord(evidence,{verifiedBy:"owner",approvalScope:"actual_revenue_verification"}).record.netAmountMinor,7500));
test("rejects unverified evidence",()=>assert.equal(createVerifiedRevenueRecord({...evidence,verificationStatus:"unverified"},{verifiedBy:"owner",approvalScope:"actual_revenue_verification"}).ok,false));
