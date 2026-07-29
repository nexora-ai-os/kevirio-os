# Provider Connection Lifecycle

状態は not configured、credential present、configuration invalid、authorization required、authorization pending、connected、scope limited、token expiring、refresh failed、revoked、disconnected、suspended、locked、error を正規状態として扱う。

Credentialの存在、接続状態、権限、Cost、Circuit、Feature maturity、External Executionを混同しない。connectedでも実行許可を意味しない。refresh失敗、account mismatch、scope不足はconnectionをsuspendし、自動再認可しない。
