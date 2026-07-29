# Provider OAuth Security

Google／CanvaはAuthorization Code Flowを使用する。stateは256-bit random、PKCE S256、10分expiry、one-time consumption、Workspace・Owner・Provider・Redirect URI bindingを必須とする。

Access token、refresh token、PKCE verifierはserver-side AES-256-GCMで暗号化し、DBにはciphertextだけを保存する。暗号鍵欠落時はcallbackを含む全操作を拒否する。token、code、state、raw provider errorをログ・URL・Browser responseへ含めない。

初期Scopeはread-only。write、send、publish、delete、scope upgrade、revokeは別のOwner Approvalを必要とし、現在はLOCKEDである。
