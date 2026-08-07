import { buildBusinessIntelligenceV3 } from "../domain/businessIntelligenceV3.js";
import { EMPLOYEE_REGISTRY } from "./aiEmployeePlatform.js";

const safeEmployeeState=()=>Object.freeze(Object.values(EMPLOYEE_REGISTRY).map((employee)=>Object.freeze({
  role:employee.department || "Unknown",
  maturity:employee.maturity || "Unknown",
  externalExecution:false,
})));

export function createBusinessIntelligenceV3Service({companyCoreRepository,revenueEngineService,affiliateService,readAiEmployeeState=safeEmployeeState}) {
  if(!companyCoreRepository?.readSnapshot||!revenueEngineService?.readPerformance||!affiliateService?.getAffiliateCommandCenter||typeof readAiEmployeeState!=="function")throw new TypeError("business_intelligence_dependencies_required");
  return Object.freeze({
    async read(workspaceId){
      if(!workspaceId)throw new TypeError("workspace_id_required");
      const names=["companyCore","revenue","affiliate","aiEmployees"];
      const settled=await Promise.allSettled([
        companyCoreRepository.readSnapshot(workspaceId),
        revenueEngineService.readPerformance(workspaceId),
        affiliateService.getAffiliateCommandCenter(workspaceId),
        Promise.resolve(readAiEmployeeState(workspaceId)),
      ]);
      const values=Object.fromEntries(settled.map((result,index)=>[names[index],result.status==="fulfilled"?result.value:null]));
      const availability=Object.freeze(Object.fromEntries(settled.map((result,index)=>[names[index],result.status==="fulfilled"?"available":"unavailable"])));
      return buildBusinessIntelligenceV3({...values,availability});
    },
  });
}
