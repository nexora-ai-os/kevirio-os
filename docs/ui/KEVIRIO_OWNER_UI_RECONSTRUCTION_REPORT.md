# KEVIRIO Owner UI Reconstruction Report

## Scope

Owner承認画像およびMaster Directiveに基づき、Production Shell、Gold K identity、Design Tokens、10画面の視覚階層・日本語表示・Responsive behaviorを再構成する。変更範囲はUI/Brand layerのみ。

## Interruption recovery

- Branch: `feat/revenue-repository-integration-v1`
- Baseline HEAD: `4837c813c75794837ef10d83c564afdee87f3761`
- 電源断前の16 UIファイル差分を回収。競合Marker、Staged変更、破損した空UIファイルは検出されなかった。
- `docs/audit.zip.zip` は既存の未追跡ファイル。未変更・未読・未Stage。

## Implemented reconstruction

- White / Pearl / Champagne Goldを主軸とするToken体系。
- Mint/Aqua BrandMarkをGold Kへ置換。
- Desktop sticky Sidebar、Owner Topbar、Mobile bottom navigation。
- 44px操作領域、focus-visible、Reduced Motion、Responsive card/table behavior。
- HomeをOwner command surfaceへ再構成。
- Insightsは検証済みデータがない場合、4枚のUnknown KPIではなく説明付きEmpty Stateを表示。
- InboxはProductionデータソース不在を明示し、架空通知を生成しない。
- Provider secret、Actor/Workspace識別子をPrimary UIに表示しない。

## Architecture preservation

Database、Migration、RLS、RPC、Repository contract、Authentication、Approval semantics、Evidence semantics、Actual Revenue、Cost Guard、Provider gateway、Workspace isolation、Audit behavior、External Executionには変更を加えていない。Google OperationsはDry Run、外部API呼び出し0を維持する。

## Validation record

Validation結果は実行後に最終応答とGit diffで報告する。Browser Screenshotは実ファイルの存在を確認できた場合のみPASSとする。Build PASSだけで完成扱いにはしない。

## Git policy

Commit、Push、Merge、Rebase、Amend、Deploy、Migration適用は実施しない。全変更はOwner review用に未Stageで保持する。

## Owner Login manual smoke test

Status: **Browser Validation Blocked**。in-app BrowserのSandbox ACL障害により、次の項目はOwner環境で確認する。

1. 入力するメールアドレスとEnvironment表示を確認する。
2. Caps Lockをオンにし、警告が表示されることを確認する。
3. Password表示切替で文字が確認でき、値が変化しないことを確認する。
4. Password managerからEmailとPasswordを入力できることを確認する。
5. Login Buttonを1回押し、Network requestが1回だけ送信されることを確認する。
6. 正しい資格情報でHTTP 200、Owner verification、Home遷移を確認する。
7. Reload後もSessionが維持されることを確認する。
8. Logout後に再Loginできることを確認する。
9. 誤Passwordで日本語の`invalid_credentials`表示を確認する。
10. DesktopとMobileでLabel、48px操作領域、Focus、Error表示を確認する。
11. ConsoleとNetworkにPassword、Token、Session、API Keyが存在しないことを確認する。
