# Security Audit

## HIGH

1. **App全体がSupabase Authで保護されない**: `App.jsx:167`でReview pageだけGate。Business localStorage/UIは認証前に利用可能。Deployment Basic Auth適用は未検証。
2. **Business data isolationなし**: workspace/client business tables/RLSが存在せず、localStorage keysもnamespaceなし。
3. **Dependency vulnerability**: npm auditでPostCSS `GHSA-r28c-9q8g-f849` High、fix available。
4. **機密Business Memoryが平文localStorage**: device/browser access、XSS、shared profile、backup不能/削除不完全。

## MEDIUM

- CSP/security headers、rate limit（request/monthly budget以外）、CSRF token、URL/file/webhook validation frameworkなし。
- retention/deletion/export/audit/incident response policyなし。
- Provider data classification/redaction/allowlistなし。
- `middleware.js` Basic AuthとSupabase Owner Authの二重境界が統合されていない。
- SourceはUTF-8。監査Shell側もUTF-8明示が必要。

## Positive controls

Service key/OpenAI keyはserver参照のみ。`.env*`はignore。Bearer tokenはheaderのみ。Origin exact match、server-side Supabase user verification、active owner profile、security-definer RPC hardening、budget/idempotency/timeout/structured output、external/production/actualRevenue false guardsがある。

## Secret audit

Tracked `.env*`なし。現worktreeのclient sourceにserver secret identifierなし。Git historyにはcredential **変数名**を含むcommitがあるが、値の露出は安全上表示せず、全履歴content scan/remote secret scannerは未実施のため `NOT VERIFIED`。Secret実値を報告書へ記載していない。
