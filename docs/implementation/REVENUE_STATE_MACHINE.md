# Revenue State Machine

Canonical transitions are defined in `src/domain/revenueStateMachine.js`. UI cannot infer skipped transitions. Commands require idempotency keys. Approval snapshot and execution payload hashes must match. Artifact version changes require reapproval.

Campaign happy path:

`draft → preparing → review_required → approved_internal → execution_ready → manually_executed → result_pending → evidence_pending → revenue_verified → closed`

Actual correction is a new `revenue_records` row using `correction_of_id`; existing rows are not updated.
