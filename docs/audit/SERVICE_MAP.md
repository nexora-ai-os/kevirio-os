# Service Map

## Active Revenue vertical slice

`marketIntelligenceEngine` → `marketIntelligenceAdapter` → `marketDecisionService` → `campaignRecommendationHandoffService` → `marketCampaignCandidateService` → `ownerReviewCandidateAdapter` → `ownerReviewDecisionService` → `revisionCandidateService` → `publishImprovementService`。

全段階はschema/validation/idempotent IDを持つが、`dataMode=mock`, `isMock=true`, `productionExecution=false`, `externalExecution=false`, `actualRevenueConnected=false`を強制する。StorageはlocalStorage。

## Campaign/package

`revenueCampaignService`は`buildMockRevenueCampaign`、`revenuePackageService`はArtifact package、`crossLaneRevenueOrchestrator`はDirect/Affiliate/SNSの3lane候補を生成。Forecastのみ。

## Live sandbox

`openAISandboxGateway` → `/api/ai` → `verifiedOwnerContext` → `supabaseUsageStoreAdapter` → `openaiSandboxAdapter`。実OpenAI callはこの経路だけで、Production publish/revenueには接続しない。

## Legacy/parallel engines

`campaignEngine`, `workflowEngine`, `pipelineEngine`, `opportunityEngine`, `memoryEngine`, `agentEngine`, `agentCompany`, `ceoEngine`等が並行しており、Revenue vertical sliceのcanonical domainには統合されていない。重複/Legacy候補。
