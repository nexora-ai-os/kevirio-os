export function buildCanonicalRevenueOverview(snapshot={}) {
  const campaigns=Array.isArray(snapshot.campaigns)?snapshot.campaigns:[];
  const approvals=Array.isArray(snapshot.approvals)?snapshot.approvals:[];
  const revenue=Array.isArray(snapshot.revenue)?snapshot.revenue:[];
  const workflows=Array.isArray(snapshot.workflows)?snapshot.workflows:[];
  const pending=approvals.filter((item)=>item.status==="pending");
  const netActualMinor=revenue.reduce((sum,item)=>sum+Number(item.net_amount_minor || 0),0);
  const grossActualMinor=revenue.reduce((sum,item)=>sum+Number(item.gross_amount_minor || 0),0);
  const nextWorkflow=workflows.find((item)=>item.status!=="completed") || null;
  const nextAction=pending.length
    ? {title:"Owner承認を確認する",reason:`Canonical承認待ちが${pending.length}件あります。`,page:"approval",nextScreen:"Approval"}
    : nextWorkflow?.current_step==="manual_package_ready"
      ? {title:"Revenue Packageを手動実行する",reason:"承認済みPackageのCopyまたはDownloadが次のActionです。",page:"production",nextScreen:"Production Revenue"}
      : nextWorkflow?.current_step==="evidence_waiting"
        ? {title:"実営業のEvidenceを登録する",reason:"Evidence登録までActual Revenueには計上されません。",page:"production",nextScreen:"Production Revenue"}
        : {title:"Production Revenueを確認する",reason:"Canonical Revenue workflowの現在地を確認します。",page:"production",nextScreen:"Production Revenue"};
  return {campaignCount:campaigns.length,pendingApprovals:pending.length,revenueRecordCount:revenue.length,netActualMinor,grossActualMinor,currentStep:nextWorkflow?.current_step || "idle",nextAction};
}
