# KEVIRIO v5.2 Social Revenue Engine

## 置き換えるファイル
```txt
src/App.jsx
src/components/HomeCommandCenter.jsx
src/components/Analytics.jsx
src/styles.css
```

## 新しく追加するファイル
```txt
src/components/SocialRevenuePanel.jsx
src/services/socialRevenueEngine.js
```

## 入れる場所
```txt
SocialRevenuePanel.jsx
→ src/components/

socialRevenueEngine.js
→ src/services/

App.jsx / HomeCommandCenter.jsx / Analytics.jsx / styles.css
→ 既存ファイルを置き換え
```

## 削除するファイル
```txt
なし
```

## Commit message
```txt
Build KEVIRIO v5.2 Social Revenue Engine
```

## 追加内容
- SNS収益化の基盤を追加
- HomeにSocial Revenueの簡易表示を追加
- AnalyticsにSNS収益管理パネルを追加
- 投稿準備、予約投稿準備、コメント/DM管理、フォロワー分析、アルゴリズム管理の設計を追加
- Instagram / Threads / X / TikTok / YouTube / LinkedIn / Pinterest を管理対象に追加
- AI社員: Social / Community / Publisher / Growth / Ads / Analytics / Memory を前提化

## 注意
SNS投稿、DM返信、コメント返信、広告出稿は自動実行しません。
AIは準備・分析・下書き・返信案作成まで。
最終決裁は必ずオーナーです。
