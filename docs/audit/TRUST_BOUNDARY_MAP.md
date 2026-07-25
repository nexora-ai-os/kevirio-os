# Trust Boundary Map

1. Browser↔SPA: localStorageはuser-controlled/untrusted。XSS時に全Business state露出。
2. SPA↔Supabase Auth: public URL/key、session persistence。TLS/remote configは未検証。
3. Browser↔`/api/ai`: bearer + exact Origin + JSON required。CSRF相当はOrigin check。
4. API↔Supabase service role: high trust server boundary。client bundle混入なし。
5. API↔OpenAI: approved sandbox subset、no-store request flag、schema/timeout/budget。
6. External content↔Prompt/Memory: untrusted-content marker、injection filter、egress allowlistなし。
7. Workspace/brand/client: technical boundaryなし。
