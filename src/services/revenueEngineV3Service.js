import { calculateRevenuePerformance } from "../domain/revenueEngineV3.js";

const asArray=(value)=>Array.isArray(value)?value:[];

export function createRevenueEngineV3Service(revenueRepository) {
  if (!revenueRepository?.loadSnapshot) throw new TypeError("revenue_repository_required");
  return Object.freeze({
    async readPerformance(workspaceId) {
      if (!workspaceId) throw new TypeError("workspace_id_required");
      const snapshot = await revenueRepository.loadSnapshot(workspaceId);
      const forecasts = asArray(snapshot.campaigns).filter((campaign) => campaign.forecast_currency).map((campaign) => ({
        engineType: campaign.lane === "affiliate" ? "affiliate" : campaign.lane === "service" ? "agency" : campaign.lane === "media" ? "marketplace" : "digital_products",
        currency: campaign.forecast_currency,
        revenueMinor: campaign.forecast_revenue_minor,
        costMinor: campaign.forecast_cost_minor,
        assumption: "campaign_forecast",
        sourceReference: campaign.id,
      }));
      const performance=calculateRevenuePerformance({ actual:asArray(snapshot.revenue), evidence:asArray(snapshot.evidence), forecasts });
      return Object.freeze({
        ...performance,
        opportunities:Object.freeze(asArray(snapshot.opportunities)),
        approvalQueue:Object.freeze(asArray(snapshot.approvals).filter((item)=>["pending","requested"].includes(item.status))),
        executionQueue:Object.freeze(asArray(snapshot.executionPackages)),
        evidenceQueue:Object.freeze(asArray(snapshot.evidence).filter((item)=>item.verification_status!=="verified")),
        operationalBlockers:Object.freeze([
          ...asArray(snapshot.workflows).filter((item)=>["blocked","failed","partial"].includes(item.status)),
          ...asArray(snapshot.tasks).filter((item)=>["blocked","failed","partial"].includes(item.status)),
        ]),
      });
    },
  });
}
