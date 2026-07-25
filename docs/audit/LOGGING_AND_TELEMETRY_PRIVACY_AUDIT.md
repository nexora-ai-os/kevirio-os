# Logging and Telemetry Privacy Audit

Runtime loggingはlocal server start/failureとverify scripts中心。Provider adapterはraw error/message/stack/credentialを返さず、APIもsafe reason codeへ正規化する。Third-party analytics/Sentryは未実装。

不足: centralized redaction policy、structured audit logger、PII/Prompt全文禁止、retention、workspace correlation、access control。UI toast/network responseにもsafe error contractを一貫適用する必要がある。
