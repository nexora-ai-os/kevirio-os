# Business Memory Leakage Audit

最大RiskはlocalStorage上でowner/workspace/brand/client/sensitivity/provenanceを持たないこと。Cross-client retrievalを防ぐquery/RLS/cache keyがなく、generated inferenceとfactの強制区別もない。

必要最小Policy候補: `workspaceId`, `brandId`, `clientId`, `ownerId`, `sensitivityLevel`, `allowedUse`, `allowedProviders`, `externalOutputAllowed`, `retentionPolicy`, `deletionStatus`, `consentStatus`, `provenance`。

Prompt injectionによる抽出を防ぐauthorization/output filter/tool egress controlは未実装。現状は外部content ingestion自体が本実装されていないためExploit実証は未実施。
