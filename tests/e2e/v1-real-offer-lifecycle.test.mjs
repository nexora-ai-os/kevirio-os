import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCompanyCycle, groupProfitByCurrency } from "../../src/domain/companyOperatingSystem.js";

const migration=readFileSync(new URL("../../supabase/migrations/013_company_operating_cycle.sql",import.meta.url),"utf8");

test("V1 real offer lifecycle remains manual evidence gated and profit truthful",()=>{
  const operation={
    id:"operation",approval_request_id:"approval",status:"performance_waiting",
    intelligence_snapshot:{sourceKind:"owner_supplied"},audience_snapshot:{segment:"verified input"},
    strategy_snapshot:{forecastOnly:true},content_snapshot:{article:{headline:"Approved"}},
    schedule_snapshot:{timezone:"Asia/Tokyo",externalExecutionAllowed:false},
  };
  const stages=buildCompanyCycle({
    operation,approvals:[{id:"approval",status:"approved"}],performance:[{source_kind:"owner_manual"}],
    evidence:[{verification_status:"verified"}],revenue:[{currency:"JPY",amount_minor:50000,truth_class:"Actual"}],
    costs:[{currency:"JPY",amount_minor:5000,value_type:"actual"}],learnings:[{id:"learning"}],dataAvailable:true,
  });
  const state=Object.fromEntries(stages.map((item)=>[item.id,item.state]));
  assert.equal(state.owner_approval,"completed");
  assert.equal(state.manual_or_approved_execution,"manually_executed");
  assert.equal(state.evidence,"completed");
  assert.equal(state.verified_revenue,"completed");
  assert.equal(state.actual_cost,"completed");
  assert.equal(state.net_profit,"completed");
  assert.equal(state.optimization,"ready");
  assert.equal(state.quality_review,"unknown");
  const profit=groupProfitByCurrency({revenue:[{currency:"JPY",amount_minor:50000,truth_class:"Actual"},{currency:"USD",amount_minor:900,truth_class:"Forecast"}],costs:[{currency:"JPY",amount_minor:5000,value_type:"actual"}]});
  assert.deepEqual(profit,[{currency:"JPY",revenueMinor:50000,costMinor:5000,netProfitMinor:45000}]);
  for(const field of ["targetChannel","accountDestination","publishChecklist","evidenceCollectionInstructions","expectedMetricFields","actualResultEntry","failureRecording","ownerCompletionConfirmation"])assert.match(migration,new RegExp(`'${field}'`));
  assert.match(migration,/externalExecutionAllowed',false/);
  assert.doesNotMatch(migration,/externalExecutionAllowed',true/);
});