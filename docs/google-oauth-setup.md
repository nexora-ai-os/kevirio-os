# Google OAuth Setup

Callback候補: local `http://127.0.0.1:5173/api/oauth/google/callback`、production `${OAUTH_REDIRECT_BASE_URL}/api/oauth/google/callback`。実URLはallowlistと完全一致させる。

初期ScopeはGmail read-only、Drive metadata read-only、Calendar read-only、Analytics read-only、Search Console read-only、YouTube read-only。送信・作成・公開は追加同意とOwner ApprovalまでLOCKED。
