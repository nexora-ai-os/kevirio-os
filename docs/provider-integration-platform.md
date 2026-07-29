# KEVIRIO Provider Integration Platform

Status: ADR-PIP-001 Option A approved / implementation candidate. Production Readyの最終GOはOwnerのみが宣言する。

## Architecture Baseline

Owner / AI Employee / Workflow → Permission Guard → Approval Guard → Provider Policy → Cost Guard → Budget Reservation → Provider Gateway → Provider Adapter → External Provider

各層は前段の判断を再解釈しない。Adapterはtransport変換だけを担当する。Workspace、Policy、料金、Approval、Ledger、Reservationのいずれかが不明なら停止する。BrowserからのProvider API、SDK、Token、service roleへの到達は禁止する。

## Scalability

Provider追加はAdapterとCapability manifestで行い、Gatewayを分岐させない。Workspace単位RLS、Provider単位advisory lock、idempotency unique制約により1000 Workspace、100 AI Employee、追加10 Providerでも境界を維持する。高負荷時はqueue adapterをGateway前ではなくReservation後・dispatch前へ追加する。

## Change Control

Gateway順序、Permission、Approval、Cost Guard、Token storage、Workspace boundaryの変更は新しいADRとOwner承認を必要とする。
