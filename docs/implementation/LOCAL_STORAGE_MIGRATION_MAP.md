# LocalStorage Migration Map

| Current data | Destination | Import rule |
|---|---|---|
| opportunities/decisions | opportunities/owner_decisions | preview, validate, `legacy_mock`; never Actual |
| campaigns/tasks/artifacts | corresponding tables | workspace/brand attribution required |
| approvals | approval requests/decisions | no automatic approval carry-over |
| revenue evidence candidates | evidence_candidates | remains unverified |
| revenue/forecast | campaign forecast fields | never revenue_records |
| workflows | workflow runs/steps | import as cancelled/legacy reference only |
| Business Memory | none automatically | confidential local data must not be bulk-imported |
| UI preferences/transient messages | localStorage allowed | non-confidential only |

Existing keys are not deleted automatically. Cleanup follows Owner preview and verified database counts.
