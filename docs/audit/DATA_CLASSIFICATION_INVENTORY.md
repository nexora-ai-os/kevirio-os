# Data Classification Inventory

| Class | Examples/current location | AI send | Control |
|---|---|---|---|
| Public | generated marketing draft | possible OpenAI sandbox | scoped schema |
| Internal | tasks/workflows/decisions | localStorage | no policy |
| Confidential | campaign strategy/Business Memory | localStorage | possible if copied into sandbox | no classification |
| Restricted/Auth | keys/tokens/session | env/Supabase auth memory | token header only; keys server | partial |
| Personal Data | owner email/login | browser→Supabase | Supabase Auth | partial |
| Customer Confidential | future briefs/files/client memory | no formal store | uncontrolled future risk | absent |
| Financial | forecasts/usage/actual candidate | localStorage/Supabase usage | usage metadata only | partial |
| IP | prompts/workflow/code/brand memory | repository/localStorage | sandbox input subset | no rights metadata |

Retention、purpose、consent、allowed provider、external output、deletion status fieldsはない。
