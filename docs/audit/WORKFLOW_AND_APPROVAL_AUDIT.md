# Workflow and Approval Audit

WorkflowAutomation/WorkEngineはReact state、localStorage、短いtimerによるsimulation。定義表示と生成関数はあるが、durable run/step table、checkpoint、heartbeat、reload-safe resume、backoff、compensation、correlation-persisted errorはない。

OpenAI Sandboxだけはtimeout、1 retry、idempotency reservation、cache、usage commit/releaseを持つ。これはProvider transaction guardであり全社Workflow engineではない。

Approvalは少なくともlegacy `nexora-approvals`、`kevirio-approvals-os`、Market Decision、Owner Review Decisionが分散。外部publish/email/DM/payment/OAuth/deploy別scopeの永続entity、expiry、duplicate prevention、audit identityは未統合。

`OwnerReviewWorkspace`はReviewの実UIだが、Production external executionはfalse。内部承認と公開承認を混同しない安全設計は一部あるものの、実行系未接続。
