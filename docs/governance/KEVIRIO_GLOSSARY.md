# KEVIRIO Glossary

| Metadata | Value |
|---|---|
| Document name | KEVIRIO Glossary |
| Version | 1.0 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Authority | Canonical vocabulary; does not change implementation |
| Last reviewed | 2026-08-01 |
| Source of Truth level | Term definitions subordinate to explicit Owner decisions, Constitution and implementation evidence |

## Usage Rules

日本語を主言語とし、英語のcanonical technical termを併記する。同じ語をUI、Business、Databaseで異なる意味に再定義しない。定義と実装が競合する場合はConflictとして停止・報告し、Glossaryだけで動作を変更しない。Secret/Tokenの値は記録しない。

各表の「成熟度」は用語の存在ではなく、現在の関連実装を示す。汎用概念またはremote未確認事項はDOCUMENTED、UNKNOWN、CONDITIONAL等を明記する。

## Product and Governance

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **KEVIRIO** | Ownerが最終判断し、AI Employeeが会社運営の準備・実行支援・計測・改善を行うプロダクト。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **AI Company Operating System** | AI Employee、承認、業務、Evidence、Revenue、Provider、Cost Guardを統合する運営システム。汎用Dashboardや単体Chat toolではない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Constitution** | ConstitutionはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Architecture Baseline** | Architecture BaselineはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Runbook** | RunbookはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Governance** | GovernanceはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Owner Decision** | Owner DecisionはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Source of Truth** | Source of TruthはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Single Source of Truth** | Single Source of TruthはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Decision Framework** | Decision FrameworkはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Definition of Done** | Definition of DoneはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **UI Freeze** | 承認済みUIを基準化し、許可された最小変更以外の再設計を停止する管理状態。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Release Gate** | Release GateはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |
| **Feature Lifecycle** | Feature LifecycleはKEVIRIOの「Product and Governance」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Constitution / ADR | DOCUMENTED / implementation-dependent |

## People and Roles

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Owner** | KEVIRIOにおける最終意思決定者。AIが権限を上書きすることはない。 | Auth source / Constitution / Migration 003 | DOCUMENTED / implementation-dependent |
| **AI Employee** | 明示されたRole、Permission、Input/Output、Cost、Failure、Metrics、Workflow等のcontract内で働くAI実行主体。Providerそのものではない。 | Auth source / Constitution / Migration 003 | DOCUMENTED / implementation-dependent |
| **Staff** | StaffはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | Not Implemented |
| **Admin** | AdminはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | Not Implemented |
| **User** | UserはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | Not Implemented |
| **Actor** | ActorはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | DOCUMENTED / implementation-dependent |
| **Principal** | PrincipalはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | DOCUMENTED / implementation-dependent |
| **Service Role** | Service RoleはKEVIRIOの「People and Roles」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth source / Constitution / Migration 003 | DOCUMENTED / implementation-dependent |

## Workspace and Permissions

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Workspace** | データと権限を隔離する組織的境界。単なる画面filterではない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Workspace Membership** | Workspace MembershipはKEVIRIOの「Workspace and Permissions」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Owner Verification** | sessionに加えOwner profileのrole/status等を確認しOwner権限を確定すること。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Permission** | Principalが行為を実行してよいかを表す認可。Capabilityが可能であることとは別。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Capability** | システムまたはAI Employeeが技術的に実行可能な機能。許可を意味しない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Scope** | OAuthまたは処理に許された資源・操作の範囲。KEVIRIOのPermission判定を置き換えない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Role** | RoleはKEVIRIOの「Workspace and Permissions」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **RLS** | PostgreSQL Row Level Security。Workspace単位の行アクセスをdatabase側で強制する。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Protected RPC** | 認証、Workspace、整合性、transaction等をserver/database側で検証するRPC。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Workspace Boundary** | Workspace BoundaryはKEVIRIOの「Workspace and Permissions」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |
| **Credential Boundary** | Credential BoundaryはKEVIRIOの「Workspace and Permissions」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 003 / repositories / auth tests | DOCUMENTED / implementation-dependent |

## Business Entities

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Offer** | Advertiser等が提示する商業条件・案件候補。Campaign、Operation、Opportunityと同義ではない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Advertiser** | AdvertiserはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Campaign** | 目的、期間、Offer等をまとめる収益活動単位。実行状態であるOperationとは別。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Opportunity** | 収益化可能性を表す候補record。Offerそのものでも確定売上でもない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Artifact** | ArtifactはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Package** | PackageはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Manual Execution Package** | Ownerが外部で手動実行するための固定化されたartifact。作成自体は外部送信ではない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Content** | ContentはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Strategy** | StrategyはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Intelligence** | IntelligenceはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Performance** | PerformanceはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |
| **Learning** | LearningはKEVIRIOの「Business Entities」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / repositories | DOCUMENTED / implementation-dependent |

## Operations and Workflow

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Operation** | Offer/Campaignを実務処理する運用単位。Workflowの定義そのものではない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Workflow** | Taskの順序、状態遷移、gateを定義する処理設計。個別実行instanceはWorkflow Run。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Workflow Run** | Workflow RunはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Task** | Workflow内の限定された作業単位。外部送信・公開を自動的に意味しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Job** | JobはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Queue** | QueueはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | Not Implemented |
| **Schedule** | ScheduleはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | Not Implemented |
| **Manual Publish** | Ownerまたは人間がKEVIRIO外で公開操作を行うこと。External Executionとは実行主体が異なる。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **External Execution** | KEVIRIO外のProviderへ実際の送信、公開、変更等を行う操作。現在はLOCKED。 | Migrations 003 and 009 / offerOperationsRepository | LOCKED |
| **Dry Run** | 外部変更を起こさずrequest/permission/quota等を検証する実行形態。Mockではない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Execution** | ExecutionはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Retry** | RetryはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Idempotency** | IdempotencyはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Failure** | FailureはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |
| **Blocked** | BlockedはKEVIRIOの「Operations and Workflow」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003 and 009 / offerOperationsRepository | DOCUMENTED / implementation-dependent |

## Approval

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Approval Request** | Owner判断を求める対象snapshotとcontext。判断結果であるApproval Decisionとは別。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Approval** | 保護されたOwner意思決定プロセス。単なるUI上の確認表示ではない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Approval Decision** | Approval Requestに対する記録済みの判断とsnapshot参照。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Snapshot** | 特定時点の対象内容。現在の可変dataと同一ではない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Immutable Snapshot** | 承認後に内容を差し替えられない判断対象snapshot。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Hash** | HashはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Version** | VersionはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Expiry** | ExpiryはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **One-time semantics** | One-time semanticsはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Approve** | ApproveはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Reject** | RejectはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Revise** | ReviseはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Hold** | 正規の状態遷移はUNKNOWN。Owner Decisionが必要であり、実装やUIで推測しない。 | Migrations 003, 005, 007–008 / revenueRepository | UNKNOWN |
| **Pending** | PendingはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Completed** | CompletedはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Expired** | ExpiredはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Cost Threshold** | Cost ThresholdはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Risk** | RiskはKEVIRIOの「Approval」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 007–008 / revenueRepository | DOCUMENTED / implementation-dependent |

## Evidence and Revenue

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Evidence** | 主張を検証する根拠情報。単なる添付fileまたはActual Revenueそのものではない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Evidence Candidate** | 未検証のEvidence候補。Verified EvidenceやActual Revenueではない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Evidence Reference** | Evidence ReferenceはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Evidence Verification** | Evidence Candidateの真正性・対応関係・必要条件を検証するgate。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Actual Revenue** | Evidence Verificationと必要なApproval/整合性を通過した実績売上。ForecastやMockを含めない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Forecast Revenue** | 将来の売上予測。Actual Revenueではない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Mock Revenue** | fixtureまたはsimulationの売上値。ForecastにもActualにも昇格しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Gross Revenue** | Gross RevenueはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Cost** | CostはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Profit** | ProfitはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Margin** | MarginはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Currency** | CurrencyはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Revenue Package** | Revenue PackageはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Verified Actual** | Verified ActualはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Evidence Gate** | Evidence GateはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Revenue Repository** | Revenue RepositoryはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Insights** | InsightsはKEVIRIOの「Evidence and Revenue」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Unknown** | 証拠不足で値または状態を確定できないこと。Zero、Unregistered、Unverifiedとは別。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Zero** | 測定対象の値が確認され、その値が0であること。Unknownではない。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Unregistered** | 対象recordが登録されていないこと。存在や値が不明というUnknownとは別。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |
| **Unverified** | recordは存在するが必要な検証が完了していない状態。 | Migrations 003, 005, 008 / revenueRepository | DOCUMENTED / implementation-dependent |

## AI Employee

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **AI Employee Registry** | AI Employee RegistryはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Employee Contract** | Employee ContractはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Role** | RoleはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Input** | InputはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Output** | OutputはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Permission** | Principalが行為を実行してよいかを表す認可。Capabilityが可能であることとは別。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Cost** | CostはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Failure** | FailureはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Retry** | RetryはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Log** | LogはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Metrics** | MetricsはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Latency** | LatencyはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Workflow** | Taskの順序、状態遷移、gateを定義する処理設計。個別実行instanceはWorkflow Run。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Prompt** | PromptはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Prompt Version** | Prompt VersionはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Prompt Hash** | Prompt HashはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Model** | Providerが提供する推論model。Provider全体またはAI Employeeではない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Temperature** | TemperatureはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Current Task** | Current TaskはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Last Activity** | Last ActivityはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Maturity** | MaturityはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |
| **Google Operations** | Google OperationsはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | CONDITIONAL |
| **AI Generation** | AI GenerationはKEVIRIOの「AI Employee」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Constitution §11 / migration 012 / employee registry | DOCUMENTED / implementation-dependent |

## Provider and OAuth

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Provider** | 外部AI/SaaS/API能力を提供する接続先。AI Employee、Model、Workflowではない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Connection** | Provider ConnectionはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Adapter** | Provider AdapterはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Gateway** | Provider GatewayはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Runtime** | Provider RuntimeはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **OAuth** | OAuthはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Access Token** | 限定期間のProvider API accessに用いるcredential。値は文書/UIへ記載しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Refresh Token** | Access Token更新に用いる長期credential。値はserver-onlyで扱う。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Credential** | 外部systemまたはprivileged serviceへの権限を証明する秘密情報の総称。Tokenは一種。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Credential Storage** | Credential StorageはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Scope** | OAuthまたは処理に許された資源・操作の範囲。KEVIRIOのPermission判定を置き換えない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Quota** | QuotaはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Health** | HealthはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Health** | Provider HealthはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Provider Readiness** | Provider ReadinessはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Google** | GoogleはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Canva** | CanvaはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **OpenAI** | OpenAIはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Anthropic** | AnthropicはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Gemini** | GeminiはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |
| **Perplexity** | PerplexityはKEVIRIOの「Provider and OAuth」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Server provider modules / migrations 010–011 | DOCUMENTED / implementation-dependent |

## Cost and Quota

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Cost Guard** | Provider利用前後のbudget、quota、reservation、ledger、allowlist、circuit breakerによるfail-closed統制。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Budget** | BudgetはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Quota** | QuotaはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Reservation** | ReservationはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Ledger** | LedgerはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Circuit Breaker** | Circuit BreakerはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Cost Threshold** | Cost ThresholdはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Request Cost** | Request CostはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Monthly Cost** | Monthly CostはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Model Allowlist** | Model AllowlistはKEVIRIOの「Cost and Quota」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |
| **Fail Closed** | 設定、証拠、permission、health等を確定できない場合に実行を許さない原則。 | Migration 010 / provider runtime | DOCUMENTED / implementation-dependent |

## Data and Architecture

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Repository** | UI/applicationとProduction data accessの間にあるdomain boundary。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Repository Contract** | Repository ContractはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **RPC** | RPCはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Protected RPC** | 認証、Workspace、整合性、transaction等をserver/database側で検証するRPC。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Migration** | Database schema/function/policyのversioned変更artifact。file存在はremote適用証明ではない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Additive Migration** | 過去の適用済みmigrationを編集せず、新番号で追加する変更。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Table** | TableはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Record** | RecordはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Transaction** | TransactionはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Constraint** | ConstraintはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Unique Constraint** | Unique ConstraintはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Foreign Key** | Foreign KeyはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Index** | IndexはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Client** | ClientはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Server** | ServerはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Serverless API** | Serverless APIはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Runtime** | RuntimeはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Production Graph** | Production GraphはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Legacy Graph** | Legacy GraphはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Lazy Loading** | Lazy LoadingはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Route** | RouteはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |
| **Canonical Route** | Canonical RouteはKEVIRIOの「Data and Architecture」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Repository source / migrations / Architecture Baseline | DOCUMENTED / implementation-dependent |

## Security and Audit

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Audit** | AuditはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Audit Log** | security/domain上の重要eventを追跡するrecord。一般application logとは別。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Append-only** | Append-onlyはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Redaction** | RedactionはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Secret** | SecretはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Credential Exposure** | Credential ExposureはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Authentication** | Principalが誰かを確認する処理。実行許可を決めるAuthorizationとは別。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Authorization** | 認証済みPrincipalに行為を許すかを判断する処理。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Session** | SessionはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Owner Session** | Owner SessionはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Fail Closed** | 設定、証拠、permission、health等を確定できない場合に実行を許さない原則。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Trust Boundary** | Trust BoundaryはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Security Boundary** | Security BoundaryはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **Allowed Origin** | Allowed OriginはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |
| **CORS** | CORSはKEVIRIOの「Security and Audit」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Auth/server source / migration 003 / security tests | DOCUMENTED / implementation-dependent |

## Environment and Release

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Local** | LocalはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Development** | DevelopmentはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Preview** | PreviewはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Production** | 文脈依存。Feature maturityではproduction-backedな実装、Environmentでは本番稼働環境を指し、両者を混同しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Environment Variable** | Environment VariableはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Build-time Variable** | Build-time VariableはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Server-only Variable** | server runtimeだけで参照しclientへ露出しない設定。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Client-exposed Variable** | Vite等でbrowser bundleから参照可能な設定。secretを置いてはならない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Deploy** | DeployはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Commit** | CommitはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Push** | PushはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Release** | ReleaseはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Rollback** | RollbackはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Smoke Test** | Smoke TestはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |
| **Production Readiness** | Production ReadinessはKEVIRIOの「Environment and Release」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | .env.example / vercel.json / Runbook | DOCUMENTED / implementation-dependent |

## UI / UX

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Owner UI** | Owner UIはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Owner Home** | Owner HomeはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Application Shell** | Application ShellはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Sidebar** | SidebarはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Topbar** | TopbarはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Owner Menu** | Owner MenuはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Design System** | Design SystemはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Design Token** | Design TokenはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Page Archetype** | Page ArchetypeはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Hero** | HeroはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Empty State** | Empty StateはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Error State** | Error StateはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Locked State** | Locked StateはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Loading State** | Loading StateはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Data Readiness** | Data ReadinessはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **System Boundary** | System BoundaryはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Japanese-first** | Japanese-firstはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Gold K Identity** | Gold K IdentityはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Responsive** | ResponsiveはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Accessibility** | AccessibilityはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Reduced Motion** | Reduced MotionはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |
| **Touch Target** | Touch TargetはKEVIRIOの「UI / UX」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design System docs/source / UI validation reports | DOCUMENTED / implementation-dependent |

## Feature Maturity and Validation

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Idea** | IdeaはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Research** | ResearchはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Design** | DesignはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Prototype** | PrototypeはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Mock** | fixtureまたは決定的simulation。PrototypeやProduction dataではない。 | Governance Index / Runbook §7 / Validation Evidence | MOCK |
| **Conditional** | 実装はあるがenvironment、remote state、Owner verification等のgateに依存する成熟度。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Production** | 文脈依存。Feature maturityではproduction-backedな実装、Environmentでは本番稼働環境を指し、両者を混同しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Locked** | 安全・承認上の理由で意図的に利用不能な状態。DisabledやErrorとは別。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Deprecated** | DeprecatedはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Archived** | ArchivedはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Removed** | RemovedはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Source Validated** | source/automated policyが確認された段階。Build/Browser/Owner approvalを意味しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Build Validated** | Production buildが成功した段階。Browser動作を意味しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Browser Validated** | 対象browser/sessionで動作確認した段階。Owner承認を意味しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Owner Approved** | Ownerが対象scopeを明示承認した状態。実装済み・テスト済みから推定しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Blocked** | BlockedはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Deferred** | DeferredはKEVIRIOの「Feature Maturity and Validation」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |
| **Unknown** | 証拠不足で値または状態を確定できないこと。Zero、Unregistered、Unverifiedとは別。 | Governance Index / Runbook §7 / Validation Evidence | DOCUMENTED / implementation-dependent |

## Error / State Semantics

| Term / 日本語 | Canonical definition / What it is not | Source of truth | Current maturity |
|---|---|---|---|
| **Error** | ErrorはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Disabled** | 設定または選択により無効な状態。安全上解除不能なLockedと同義ではない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Unavailable** | UnavailableはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Not Implemented** | Not ImplementedはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Loading** | LoadingはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Empty** | EmptyはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Success** | SuccessはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Warning** | WarningはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Failed** | FailedはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Cancelled** | CancelledはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |
| **Paused** | PausedはKEVIRIOの「Error / State Semantics」領域で用いるcanonical term。具体的なdata shapeまたは状態遷移はsource、migration、testに存在する範囲だけを有効とし、この定義だけで未実装動作を追加しない。 | Design system semantic states / source behavior | DOCUMENTED / implementation-dependent |

## Critical Entry Details

### Actual Revenue

- Japanese: 実績売上
- English: Actual Revenue
- Category: Evidence and Revenue
- Canonical definition: Evidence Verificationと必要なApproval/整合性を通過した実績売上。ForecastやMockを含めない。
- Data representation: `revenue_records` and protected verification path.
- UI representation: verified actual only; forecast/mock labels must remain separate.
- Lifecycle: candidate evidence → verification → integrity/approval gate → verified record.
- Security/integrity: cannot be created by presentation logic.
- Evidence: migrations 003/005/008; revenueRepository; integration tests.

### Approval

- Japanese: 承認
- English: Approval
- Category: Approval
- Canonical definition: 保護されたOwner意思決定プロセス。単なるUI上の確認表示ではない。
- Data representation: approval request, immutable target snapshot and decision records.
- UI representation: pending/decision state with explicit actions; Hold remains UNKNOWN.
- Security/integrity: current data cannot silently replace the approved snapshot.
- Evidence: migrations 003/007/008; repository and tests.

### External Execution

- Japanese: 外部実行
- English: External Execution
- Category: Operations and Workflow
- Canonical definition: KEVIRIO外のProviderへ実際の送信、公開、変更等を行う操作。現在はLOCKED。
- UI representation: LOCKED; Dry Run and manual package are distinct.
- Security/integrity: Approval alone does not unlock it.
- Current maturity: LOCKED.
- Evidence: provider gates, Runbook, Architecture Baseline.

## Semantic Distinctions

| Distinction | Canonical boundary |
|---|---|
| Offer vs Campaign | Offer is a commercial proposition; Campaign organizes a revenue initiative. |
| Campaign vs Operation | Campaign expresses business intent; Operation is an execution/operations unit. |
| Operation vs Workflow | Operation is domain work; Workflow defines ordered processing and gates. |
| Workflow vs Task | Workflow is the process definition; Task is one bounded unit. |
| Task vs External Execution | Task may prepare work; External Execution changes an external provider. |
| AI Employee vs Provider | AI Employee is a governed worker contract; Provider supplies external capability. |
| Provider vs Model | Provider is the platform/vendor; Model is one inference engine it offers. |
| Capability vs Permission | Capability means technically possible; Permission means authorized. |
| Scope vs Permission | Scope limits provider resources; Permission is KEVIRIO authorization. |
| Approval Request vs Approval Decision | Request asks for judgment; Decision records the judgment. |
| Snapshot vs Current Data | Snapshot is time-fixed; current data may change. |
| Evidence Candidate vs Verified Evidence | Candidate awaits validation; verified evidence passed its gate. |
| Evidence vs Actual Revenue | Evidence supports a claim; Actual Revenue is a verified business record. |
| Actual vs Forecast | Actual is verified; Forecast is prospective. |
| Forecast vs Mock | Forecast is a modeled business projection; Mock is non-production simulation. |
| Unknown vs Zero | Unknown lacks evidence; Zero is a verified numeric value. |
| Unknown vs Unregistered | Unknown cannot be determined; Unregistered means no record is registered. |
| Locked vs Disabled | Locked is a fail-closed safety state; Disabled is configuration/selection state. |
| Locked vs Conditional | Locked is unavailable; Conditional can operate only after declared gates. |
| Mock vs Prototype | Mock is simulated data/behavior; Prototype is an immature product implementation. |
| Production feature vs Production environment | Feature maturity and deployment environment are independent axes. |
| Owner Authenticated vs Owner Verified | Authenticated has a session; Verified also satisfies Owner role/status checks. |
| Build Validated vs Browser Validated | Build proves compilation; Browser proves runtime interaction in a target browser. |
| Browser Validated vs Owner Approved | Browser evidence is technical; Owner approval is governance authority. |
| Package creation vs External sending | Creating an artifact does not transmit it externally. |
| Manual Publish vs External Execution | Manual Publish is human action; External Execution is system/provider action. |
| Cost estimate vs Actual Cost | Estimate is prospective; Actual Cost is measured/recorded usage. |
| Audit record vs Application log | Audit is integrity-relevant history; app log is operational diagnostics. |
| Credential vs Token | Credential is the broad secret class; token is one credential form. |
| Access Token vs Refresh Token | Access token calls APIs; refresh token obtains new access tokens. |
| Client-exposed key vs Server secret | Client key may ship to browser by design; server secret never may. |

## Conflict Audit

| ID | Term / Decision | Source A | Source B | Conflict | Risk | Recommended Owner Decision |
|---|---|---|---|---|---|---|
| GL-C01 | Hold | UI/domain wording | Protected approval operations | No conclusive canonical transition | Invented business semantics | Define formal lifecycle or remove action |
| GL-C02 | Production | Feature maturity | Deployment environment | Same word can refer to different axes | False readiness claim | Always qualify “Production feature/environment” |
| GL-C03 | Google Operations | Candidate designation | Current Dry Run/API call 0 | “Production candidate” can be read as live Production | Unsafe execution assumption | Retain CONDITIONAL until eligibility gates pass |
| GL-C04 | README identity | Social Revenue Engine | AI Company Operating System docs | Historical/narrow product wording | Product drift | Owner decides whether legacy README section is archived |
| GL-C05 | Remote migration | Local 010–012 files | Owner-reported remote through 009 | Local and remote state differ/are unverified | Schema drift | Verify remote ledger read-only |

## Language Rules

Do not translate `Actual` as generic 売上 without “実績”. Do not reduce `Evidence` to attachment, `Approval` to confirmation, `Provider` to AI Employee, `Dry Run` to Mock, `Locked` to Error, or `Unknown` to zero. UI labels may be natural Japanese only when the canonical distinction remains explicit.

## Change Policy

Update this Glossary for a new business entity, maturity, role, approval state, evidence/revenue class, provider state or UI state. Do not add synonyms casually. Any definition that changes behavior also requires source/contract work and, for a major architectural boundary, an ADR.

Total category count: 16. Total indexed term rows: 257 (repeated cross-domain terms intentionally retain one meaning).
