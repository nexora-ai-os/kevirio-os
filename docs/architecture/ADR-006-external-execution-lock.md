# ADR-006: External Execution Lock

Decision: external execution is default false at campaign, execution package and adapter layers. The first candidate is Direct Service manual export, dry-run only. Automatic SNS/email/payment/deploy remains out of scope.
