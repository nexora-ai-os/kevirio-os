const ISO_CURRENCY=/^[A-Z]{3}$/;

export function normalizeAffiliateOffer(value={}) {
  return {
    title:String(value.title||"").trim(), advertiser:String(value.advertiser||"").trim(),
    sourceUrl:String(value.sourceUrl||"").trim(), category:String(value.category||"その他").trim(),
    targetMarkets:[...new Set((value.targetMarkets||["JP","GLOBAL"]).filter((item)=>["JP","GLOBAL"].includes(item)))],
    commissionSummary:String(value.commissionSummary||"").trim(), currency:String(value.currency||"JPY").trim().toUpperCase(),
    commissionMinor:value.commissionMinor===""||value.commissionMinor==null?null:Number(value.commissionMinor),
    termsSummary:String(value.termsSummary||"").trim(), disclosure:String(value.disclosure||"広告・アフィリエイトを含むコンテンツです。").trim(),
  };
}

export function validateAffiliateOffer(value={}) {
  const offer=normalizeAffiliateOffer(value); const errors=[];
  if(!offer.title) errors.push("Offer名を入力してください。");
  if(!offer.advertiser) errors.push("広告主を入力してください。");
  if(!offer.commissionSummary) errors.push("報酬条件の要約を入力してください。");
  if(!offer.targetMarkets.length) errors.push("対象市場を1つ以上選択してください。");
  if(!ISO_CURRENCY.test(offer.currency)) errors.push("通貨は3文字のISOコードで入力してください。");
  if(offer.commissionMinor!==null&&(!Number.isSafeInteger(offer.commissionMinor)||offer.commissionMinor<0)) errors.push("報酬額は0以上の整数minor unitで入力してください。");
  return {valid:errors.length===0,errors,normalized:offer};
}

export function formatContentPackageMarkdown(payload={}) {
  const content=payload.content||{}; const article=content.article||{}; const video=content.shortVideo||{};
  return [`# ${payload.campaignTitle||payload.offerTitle||"KEVIRIO Content Package"}`,``,
    `> ${payload.disclosure||"広告・アフィリエイトを含むコンテンツです。"}`,``,`## 記事構成`,`### ${article.headline||""}`,
    ...(article.outline||[]).map((v)=>`- ${v}`),``,`CTA: ${article.cta||""}`,``,`## SNS投稿`,
    ...(content.socialPosts||[]).map((v)=>`- [${v.market}] ${v.text}`),``,`## ショート動画`,`Hook: ${video.hook||""}`,
    ...(video.beats||[]).map((v)=>`- ${v}`),``,`## 手動実行チェックリスト`,...(payload.executionChecklist||[]).map((v,i)=>`${i+1}. ${v}`),``,`外部自動実行: ロック中`].join("\n");
}

export function buildProfitByCurrency({revenueRecords=[],costRecords=[]}={}) {
  const result={}; const row=(currency)=>result[currency]||(result[currency]={currency,grossMinor:0,revenueCostMinor:0,operatingCostMinor:0,netProfitMinor:0,verifiedRevenueCount:0});
  for(const item of revenueRecords){const r=row(item.currency);r.grossMinor+=Number(item.gross_amount_minor||0);r.revenueCostMinor+=Number(item.cost_amount_minor||0);r.verifiedRevenueCount+=1;}
  for(const item of costRecords){if(item.value_type!=="actual")continue;row(item.currency).operatingCostMinor+=Number(item.amount_minor||0);}
  return Object.values(result).map((r)=>({...r,netProfitMinor:r.grossMinor-r.revenueCostMinor-r.operatingCostMinor}));
}

export function nextOperationAction(operation) {
  if(!operation) return "Offerを登録し、運用準備を開始してください。";
  return ({owner_artifact_approval:"Contentを確認してOwner承認してください。",manual_package_ready:"PackageをCopy/Downloadし、外部で手動公開してください。",performance_waiting:"公開後のPerformanceを登録してください。",learning_ready:"学習結果を確認し、次の一要素テストを決めてください。",closed:"運用は完了しています。"})[operation.status]||"状態を再取得してください。";
}
