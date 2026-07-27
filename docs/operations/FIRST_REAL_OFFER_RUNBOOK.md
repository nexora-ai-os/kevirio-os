# 最初の実Offer運用手順

1. SupabaseへMigration 009を適用し、アプリへOwnerログインします。
2. `Offer Operations`を開き、ASP管理画面で確認したOffer名、広告主、報酬条件、公式URL、条件、広告開示を登録します。
3. `運用準備`を押し、日本・英語市場のIntelligence、Audience、Strategy、記事/SNS/動画案を確認します。
4. Snapshot内容と広告開示を確認し、Owner承認します。
5. 承認済みMarkdownをCopy/Downloadし、OwnerがKEVIRIO外で手動公開します。KEVIRIOは送信しません。
6. 公開URL等をReferenceとしてPerformanceを登録します。
7. 実際に発生したCostだけを`Actual cost`で登録します。Forecast/Testは利益に入りません。
8. Learningを生成し、次回は一要素だけ変更します。
9. 実収益が発生した場合だけ`Production Revenue`でEvidenceを登録し、Owner承認後にActual化します。

確認結果: Reload後もOffer、Operation、承認、Package、Performance、Cost、Learningが復元され、AnalyticsのActualはEvidence未承認なら「実績未登録」のままです。

