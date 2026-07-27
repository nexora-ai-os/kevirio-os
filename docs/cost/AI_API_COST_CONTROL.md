# AI / API Cost Control

- Offer operation v1は決定的な安全テンプレートで準備し、外部AI API costを発生させません。
- 既存OpenAI sandboxのserver-only key、structured output、request上限、token上限、月次上限、timeout、idempotencyを維持します。
- `operating_cost_records`は`actual / forecast / test`を分離します。Profitに入るのはActualだけです。
- 通貨はISO 3文字、金額はinteger minor unit、通貨換算は行いません。
- 将来のProvider利用は、request前の予算判定、成功/失敗のusage記録、retry回数制限、Owner lockを必須にします。

