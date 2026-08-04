# Affiliate Intelligence V1.1 — Implementation Record

Status: Release Candidate / local repository only

## Root cause

- HomeのNext Owner Actionは`offer_operations`の有無だけで分岐し、登録済み`affiliate_offers`を評価していなかった。そのためOffer登録後もOperation作成前は「Offer登録待ち」へ戻った。
- Offer cardの「運用準備」は同一画面から`prepare_offer_operation`を即時実行するだけで、route、編集状態、再開UI、段階別validationがなかった。Operation作成後はbutton自体がdisabledとなり、再開経路もなかった。
- 失敗は汎用messageへ潰され、CTA固有の結果がOwnerに伝わらなかった。

## Architecture decision

Affiliate Intelligenceは既存正本を置換しない専門運用moduleとする。Offerは`affiliate_offers`、Approvalは`approval_requests`、Executionは`execution_packages`、Evidenceは`evidence_candidates`、Actual Revenue/Costは`revenue_records`/`operating_cost_records`、Contentは`content_assets`を引き続き正本とする。

Migration 014候補は`affiliate_programs`、`affiliate_materials`、`affiliate_publications`、`affiliate_performance_records`のみを追加する。全行はWorkspace境界を持ち、active OwnerのSELECTだけをRLSで許可する。Browserの直接mutationはrevokeし、Draft保存はOwner membershipを検証するprotected RPCへ限定する。External Executionはfalse固定である。

この決定は既存ADRのApproval、Evidence/Actual、Workspace/RLS、Repository/RPC、External Execution境界を変更せず具体化する。OwnerがADRを承認したとは扱わない。

## Implementation

- `/affiliate-intelligence`: 案件一覧、ASP、広告主、報酬、status、progress、risk/next actionのread model。
- `/operations/offers/:offerId/preparation`: 10段階の保存・再開可能Wizard。
- Offer card CTA: deep linkへ遷移し、既存案件は「運用準備を再開」と表示。
- Next Owner Action: Offer登録数ではなく対象Offerのmaturity/statusを優先順位付きで計算。
- Repository: Migration 014未適用時はoptional Affiliate readだけを空配列へfail-safeし、既存V1表示を維持。
- URL: http/httpsのみ。javascript/data/malformedを拒否。tracking/management referenceをpublic URLとして表示しない。
- Truth: Actual / Forecast / Inference / Unknownを分離し、Affiliate performanceはActual-onlyかつEvidence参照可能な補助記録とする。

## RingConn compatibility

既存RingConn Offerを削除・変更・seedしない。Owner UIから既存Offer IDへAffiliate Programを一意に関連付ける。A8.net credentials、session、tracking secret、raw provider payloadは保存しない。

## Production mutation

NONE. Migration 014はcandidateであり、Productionへ適用していない。Git commit/push/deployも本作業の範囲外。
