export const AFFILIATE_FIELD_GUIDANCE=Object.freeze({
 rewardType:{label:"報酬種別",level:"推奨",help:"成果に対する報酬の計算方法",example:"定額 / 売上割合",unit:"—",unknown:true},
 rewardSummary:{label:"報酬概要",level:"推奨",help:"主要な報酬条件を短く記載",example:"新規申込 3,000円",unit:"—",unknown:true},
 rewardDetails:{label:"報酬詳細",level:"任意",help:"金額・率・通貨・補足を構造化して保存",example:"3,000 JPY / 新規申込",unit:"通貨または%",unknown:true},
 epc:{label:"EPC",level:"任意",help:"1クリックあたりの平均報酬。ASP表示値だけを入力",example:"42.5",unit:"円/クリック",unknown:true},
 approvalRate:{label:"承認率",level:"任意",help:"発生成果のうち承認される割合",example:"75",unit:"%",unknown:true},
 revisitWindowDays:{label:"Cookie / 再訪問日数",level:"推奨",help:"クリック後に成果対象となる期間",example:"30",unit:"日",unknown:true},
 confirmationDays:{label:"確定日数",level:"任意",help:"成果発生から承認確定までの目安",example:"45",unit:"日",unknown:true},
 conversionConditions:{label:"成果条件",level:"推奨",help:"報酬が発生するために必要な条件",example:"WEB経由の新規申込完了",unit:"—",unknown:true},
 rejectionConditions:{label:"否認条件",level:"推奨",help:"成果が承認されない条件",example:"重複・虚偽・キャンセル",unit:"—",unknown:true},
 prPoints:{label:"PRポイント",level:"任意",help:"広告主が明示する訴求ポイント",example:"初回30日無料",unit:"—",unknown:true},
 listingPolicy:{label:"掲載ポリシー",level:"推奨",help:"掲載可否の確認状態。資料に明記された内容だけを選択",example:"未確認 / 掲載可 / 条件付き / 掲載不可",unit:"—",unknown:true},
 listingNgWords:{label:"NGワード",level:"推奨",help:"使用禁止と明示された語句",example:"必ず儲かる",unit:"語句",unknown:true},
 listingNgWordsRaw:{label:"NGワード原文",level:"任意",help:"資料に記載された制限文を原文のまま保持",example:"広告主資料の該当文",unit:"—",unknown:true},
 listingVerificationStatus:{label:"掲載条件確認状態",level:"推奨",help:"掲載条件をどの程度確認したか",example:"未確認 / 確認済み / 制限なし確認済み",unit:"—",unknown:true},
 sourceType:{label:"情報源種別",level:"推奨",help:"条件を確認した一次資料の種類",example:"手動確認 / ASP資料 / 添付資料",unit:"—",unknown:true},
 sourceVerifiedAt:{label:"情報確認日時",level:"推奨",help:"Ownerが資料内容を確認した日時",example:"2026-08-23 10:30",unit:"日時",unknown:true},
 promotionChannels:{label:"推奨チャネル",level:"任意",help:"この案件を扱う候補チャネル",example:"ブログ / note / SNS",unit:"複数選択",unknown:true},
 priority:{label:"優先度",level:"任意",help:"次に取り組む順番の目安",example:"3",unit:"1–5",unknown:true},
});
export const OWNER_LABELS=Object.freeze({UNKNOWN:"未確認",OWNER_MANUAL:"手動確認",CONFIRMED:"確認済み",NONE_CONFIRMED:"制限なし確認済み",NOT_CONFIRMED:"未確認",OK:"掲載可",PARTIAL:"条件付き",NG:"掲載不可",FIXED:"定額",PERCENTAGE:"割合",TIERED:"段階報酬",OTHER:"その他"});
export const fieldLabel=(key)=>AFFILIATE_FIELD_GUIDANCE[key]?.label||key;
export function fieldDescription(key){const x=AFFILIATE_FIELD_GUIDANCE[key];return x?`${x.level} · ${x.help} · 例: ${x.example} · 単位: ${x.unit} · ${x.unknown?"未確認でも保存可":"入力必須"}`:""}
