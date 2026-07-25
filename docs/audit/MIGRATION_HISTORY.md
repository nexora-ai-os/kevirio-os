# Migration History

1. `001_revenue_activation.sql`: 4 tables、RLS、3 RPC、service_role限定権限。
2. `002_reusable_sandbox_reservations.sql`: released/expired reservationの安全なreuseとreserved cost reconciliation。

両migrationはtransactionで囲まれ、verify scripts上はidempotency/security contract合格。Remote migration履歴・適用日時・rollback/backupは `NOT VERIFIED`。Migration CLI/configはRepositoryにない。
