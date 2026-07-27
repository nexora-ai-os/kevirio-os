# KEVIRIO Canonical Operating Model

Productionの正本はSupabaseです。`affiliate_offers`から開始し、`offer_operations`が既存の`campaigns`、`artifacts`、`approval_requests`、`execution_packages`へ参照を張ります。承認は既存のimmutable snapshotを再利用し、Actualは既存のEvidence承認済み`revenue_records`だけです。

```text
Offer → Intelligence (JP/GLOBAL) → Strategy/Audience → Content Artifact
      → Owner Approval → Schedule → Manual Package (external=false)
      → Performance → Cost → Profit → Learning (generated_inference)
                               ↘ Evidence → Actual approval → Revenue Record
```

- Intelligenceは`sourceKind`と`liveDataUsed`を保持し、Owner提供情報とライブ情報を混同しません。
- Contentはversioned Artifact、承認は既存Approval、実行物はidempotent Execution Packageです。
- PerformanceはRevenueではありません。Test dataは`is_test=true`です。
- Profitは通貨別に、Verified gross − Revenue cost − Actual operating costで算出します。換算しません。
- Learningは`generated_inference`であり、Actualを書き換えません。
- Browserは新テーブルをSELECTのみ。書込みはOwner membershipを確認するRPCのみです。

