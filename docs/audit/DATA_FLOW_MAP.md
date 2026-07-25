# Data Flow Map

```text
mockMarketSignals (source-controlled fixtures)
→ marketIntelligenceEngine (normalize/rank/top3)
→ MarketIntelligence UI
→ owner decision (localStorage)
→ campaign handoff/candidate (localStorage)
→ Revenue Campaign / Package (localStorage)
→ Owner Review (localStorage)
→ manual export or limited OpenAI sandbox
→ evidence candidate (localStorage, unverified)
╳ no Actual Revenue source
╳ no revenue ledger append
╳ no production external execution
```

Supabase flow:

```text
Browser Supabase Auth
→ access token in Authorization header
→ /api/ai
→ server verifies token + Origin + owner_profiles
→ RPC usage reservation
→ OpenAI Responses API
→ structured validation
→ usage/cache commit
→ response to Review UI
```

Business dataはSupabaseへ流れない。
