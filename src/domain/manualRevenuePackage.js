const safeText = (value, fallback) => String(value || "").trim() || fallback;

export function deriveCampaignTitle(opportunityTitle) {
  const base = safeText(opportunityTitle, "小規模事業者向けSNS・記事制作支援");
  return base.endsWith("提案") ? base : `${base} 提案`;
}

export function mapSalesReadyPackage({ opportunity={}, campaign={}, artifact={}, approvalSnapshot={}, destinationType="owner_selected_manual_channel" }={}) {
  const campaignTitle = deriveCampaignTitle(opportunity.title || artifact.title);
  const targetCustomer = safeText(campaign.offer?.audience, "SNSや記事制作を継続したい小規模事業者");
  const customerProblem = safeText(artifact.customerProblem || opportunity.summary, "発信に必要な時間と制作体制が不足している");
  const gross = Number(campaign.forecast_revenue_minor ?? campaign.forecastRevenueMinor ?? 50000);
  const cost = Number(campaign.forecast_cost_minor ?? campaign.forecastCostMinor ?? 10000);
  return {
    serviceName:"KEVIRIO SNS・記事制作スターターパッケージ", campaignTitle, targetCustomer, customerProblem,
    serviceSummary:"事業内容を整理し、SNS投稿案と記事原稿を手動納品できる状態まで制作します。",
    deliverables:["SNS投稿案 5本","解説記事 1本","投稿・公開チェックリスト"],
    scopeIncluded:["構成設計","日本語原稿制作","ブランドトーン確認","指定回数内の修正"],
    scopeExcluded:["SNSへの自動投稿","広告運用","成果保証","画像・動画の本制作","無制限修正"],
    forecastPriceMinor:gross, forecastCostMinor:cost, forecastNetMinor:gross-cost,
    currency:safeText(campaign.forecast_currency || campaign.forecastCurrency,"JPY"), deliveryDays:7, revisionLimit:2,
    salesShortMessage:`${targetCustomer}向けに、SNS投稿案5本と解説記事1本を7日で制作します。まずは内容確認からお気軽にご相談ください。`,
    salesLongProposal:`${targetCustomer}の発信課題を整理し、継続的な情報発信を始めるためのSNS投稿案5本と解説記事1本を制作します。構成設計から日本語原稿、ブランドトーン確認までを含み、納品後の修正は2回まで対応します。予測価格は${gross.toLocaleString("ja-JP")}円です。成果保証、自動投稿、広告運用は含みません。`,
    executionChecklist:["Owner Previewで内容を確認","必要に応じて提案文をCopyまたはMarkdownで保存","KEVIRIO外で顧客へ手動提案","結果を示すEvidenceを登録"],
    evidenceInstructions:["入金・契約・注文を確認できる参照番号を用意","実際の売上総額と原価を最小通貨単位で入力","発生日を入力","Owner承認後にActual Revenueを確定"],
    disclosure:"本Packageの金額はMock / Forecastです。実績売上ではありません。KEVIRIOは外部送信・契約・課金を実行しません。",
    lane:safeText(campaign.lane,"service"), destinationType, artifactVersion:Number(artifact.version || approvalSnapshot.artifactVersion || 1),
    approvalSnapshot, externalExecutionAllowed:false,
  };
}

export function formatRevenuePackageMarkdown(value) {
  const list=(items)=>(items || []).map((item)=>`- ${item}`).join("\n");
  return `# ${value.campaignTitle}\n\n> ${value.disclosure}\n\n## サービス概要\n${value.serviceName}\n\n${value.serviceSummary}\n\n## 対象顧客\n${value.targetCustomer}\n\n### 顧客課題\n${value.customerProblem}\n\n## 提供内容\n${list(value.deliverables)}\n\n### 対応範囲\n${list(value.scopeIncluded)}\n\n### 対象外\n${list(value.scopeExcluded)}\n\n## 価格・原価予測\n- 予測価格: ${value.forecastPriceMinor.toLocaleString("ja-JP")} ${value.currency}\n- 予測原価: ${value.forecastCostMinor.toLocaleString("ja-JP")} ${value.currency}\n- 予測差額: ${value.forecastNetMinor.toLocaleString("ja-JP")} ${value.currency}\n\n## 納期・修正回数\n- 納期目安: ${value.deliveryDays}日\n- 修正: ${value.revisionLimit}回まで\n\n## 営業用短文\n${value.salesShortMessage}\n\n## 提案用長文\n${value.salesLongProposal}\n\n## 手動実行手順\n${list(value.executionChecklist)}\n\n## Evidence登録手順\n${list(value.evidenceInstructions)}\n`;
}

export function selectOwnerSafeRevenuePackage(value) {
  const keys=["serviceName","campaignTitle","targetCustomer","customerProblem","serviceSummary","deliverables","scopeIncluded","scopeExcluded","forecastPriceMinor","forecastCostMinor","forecastNetMinor","currency","deliveryDays","revisionLimit","salesShortMessage","salesLongProposal","executionChecklist","evidenceInstructions","disclosure","lane","destinationType","artifactVersion","externalExecutionAllowed"];
  return Object.fromEntries(keys.filter((key)=>key in value).map((key)=>[key,value[key]]));
}
