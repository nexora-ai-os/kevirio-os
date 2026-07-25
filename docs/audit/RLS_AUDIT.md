# RLS Audit

4表すべてでRLS enable。`owner_profiles`, `sandbox_usage_monthly`, `sandbox_generation_cache`は`owner_id = auth.uid()`のselect policy。Reservationはclient policyなし。変更RPCは`security definer`, empty `search_path`、public/anon/authenticated revoke、service_role grant。

良い点: Browserからservice key不使用、server-only RPC、active owner check、owner mismatch防止。

不足:

- Remote適用、role grants、RLS実動作は未確認。
- Business table自体がないためworkspace/client分離は未実装。
- cache payloadにsensitivity/retention/deletion policyがない。
- service role compromise時のleast privilege分離なし。

Security判定: Sandbox tablesは `PARTIAL`、Business Data境界は `NOT_IMPLEMENTED`。
