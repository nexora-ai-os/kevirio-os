# Secret and Credential Audit

- `.env.local` exists and is ignored; variable names only inventoried。
- tracked `.env*`: none。
- Client code uses only `VITE_SUPABASE_URL` and publishable key。
- Service role/OpenAI credential identifiers are server-side。
- Verification scripts check payload/token boundaries and passed。
- Build output secret-value scanは実値を扱わない方針のため未実施。Dedicated secret scanner/remote history scanも未構成。

Git historyでvariable identifiersを含むcommitは存在するが、identifier存在はsecret exposureを意味しない。値の履歴露出は `NOT VERIFIED`。疑いがある場合はProvider Dashboardでkey revoke→new key→Vercel/Supabase secret update→redeploy→old key failure確認をOwnerが行う。
