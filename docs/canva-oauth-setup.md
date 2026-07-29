# Canva OAuth Setup

Callback候補: local `http://127.0.0.1:5173/api/oauth/canva/callback`、production `${OAUTH_REDIRECT_BASE_URL}/api/oauth/canva/callback`。Canva App設定とallowlistを完全一致させる。

最初はdesign readを使用し、create/export/writeはCapabilityとOwner Approvalを別に検証する。本実装ではOAuth認可と外部APIを実行しない。
