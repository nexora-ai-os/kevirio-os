export function mapCanonicalActualAnalytics(revenueRecords=[], campaigns=[], evidence=[]) {
  const campaignMap=new Map(campaigns.map((item)=>[item.id,item]));
  const evidenceMap=new Map(evidence.map((item)=>[item.id,item]));
  const rows=revenueRecords.map((record)=>({
    id:record.id,
    grossMinor:Number(record.gross_amount_minor), costMinor:Number(record.cost_amount_minor), netMinor:Number(record.net_amount_minor),
    currency:record.currency, lane:record.lane, campaign:campaignMap.get(record.campaign_id)?.offer?.title || "Revenue campaign",
    period:String(record.recognized_at || "").slice(0,7), evidenceStatus:evidenceMap.get(record.evidence_candidate_id)?.verification_status === "verified" ? "検証済み" : "未検証",
    verifiedAt:record.created_at,
  }));
  return { rows, grossMinor:rows.reduce((s,r)=>s+r.grossMinor,0), costMinor:rows.reduce((s,r)=>s+r.costMinor,0), netMinor:rows.reduce((s,r)=>s+r.netMinor,0), lastVerifiedAt:rows.map((r)=>r.verifiedAt).filter(Boolean).sort().at(-1) || null };
}
