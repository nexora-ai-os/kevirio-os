# Prompt Injection and Exfiltration Audit

OpenAI sandboxはfixed system prompt、allowed purpose、mock-only structured input、strict output schema、外部publish falseでattack surfaceを狭める。

一方、Web/Email/PDF/SNS/upload contentをuntrusted dataとして区分するframework、URL/domain allowlist、tool argument authorization、memory access check、secret/PII output scan、Markdown image/encoded exfiltration防止はない。将来ingestion/tool実装前のP0 security design対象。
