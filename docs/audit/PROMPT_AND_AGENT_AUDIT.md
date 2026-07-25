# Prompt and Agent Audit

## Prompt

Prompt registry/version/evaluation frameworkはない。主な実Promptは:

- `server/openaiSandboxAdapter.js`: fixed system instruction + JSON-stringified approved mock input + strict JSON schema。
- `api/ai.js`, `api/orchestrate.js`: local mock reply文字列。
- UI/services: template/brief/message文字列。

Brand/owner/workspace context injection、untrusted content boundary、prompt injection sanitizer、PII redaction、provider-specific registry、prompt cache/version testは未実装。OpenAI sandboxは入力scopeとschemaが狭く、riskを限定している。

## Agent

50-person registry/15-person MVP registry、roles、artifact assignment、prohibited actionsは豊富。しかし独立runtime/tool/handoff/provider call/traceを持つAgent群ではなく、定義とdeterministic function/UIが中心。AI CEOもlocal calculations。実model callへ繋がるのは限定OpenAI sandboxのみ。
