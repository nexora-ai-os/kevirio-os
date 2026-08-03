import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const documents = [
  "docs/governance/KEVIRIO_GOVERNANCE_INDEX.md",
  "docs/governance/KEVIRIO_DEVELOPMENT_CONSTITUTION.md",
  "docs/architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md",
  "docs/runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md",
  "docs/governance/KEVIRIO_GOVERNANCE_CHANGELOG.md",
];

test("Governance V2.1 documents remain drafts pending Owner review", () => {
  for (const path of documents) {
    const source = read(path);
    assert.match(source, /\| Version \| 2\.1 \|/);
    assert.match(source, /\| Status \| DRAFT — OWNER REVIEW REQUIRED \|/);
    assert.match(source, /\| Owner \| KEVIRIO Owner \|/);
  }
});

test("governance preserves critical production boundaries", () => {
  const all = documents.map(read).join("\n");
  assert.match(all, /Browser Validation: BLOCKED/);
  assert.match(all, /Commit, push, and deploy each require/);
  assert.match(all, /migrations `003`–`009`/i);
  assert.match(all, /Actual, Forecast, Mock, Sample, Test, and Unconnected values must remain explicitly separated/);
  assert.match(all, /External Execution.*fail-closed|External Execution is fail-closed/s);
});

test("repository entry points link to the governance index", () => {
  assert.match(read("README.md"), /docs\/governance\/KEVIRIO_GOVERNANCE_INDEX\.md/);
  assert.match(read("AGENTS.md"), /docs\/governance\/KEVIRIO_GOVERNANCE_INDEX\.md/);
});

test("final governance refinement defines all Owner-required decision contracts", () => {
  const constitution = read("docs/governance/KEVIRIO_DEVELOPMENT_CONSTITUTION.md");
  const architecture = read("docs/architecture/KEVIRIO_ARCHITECTURE_AND_PRODUCTION_BASELINE.md");
  const runbook = read("docs/runbooks/KEVIRIO_DEVELOPMENT_AND_RELEASE_RUNBOOK.md");
  for (const heading of ["Decision Framework", "UI Quality Standard", "Design System Rule", "AI Employee Contract"]) assert.match(constitution, new RegExp(`## \\d+\\. ${heading}`));
  for (const heading of ["Feature Lifecycle", "KPI Governance"]) assert.match(architecture, new RegExp(`## \\d+\\. ${heading}`));
  for (const heading of ["Validation Levels", "Repository Clean Rule", "Owner Review Checklist"]) assert.match(runbook, new RegExp(`## \\d+\\. ${heading}`));
  assert.match(runbook, /Do not propose or add further governance unless the Owner explicitly reopens governance work/);
});

test("design knowledge closure provides the required draft ADR inventory", () => {
  const adr = read("docs/architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md");
  assert.match(adr, /\| Version \| 1\.0 \|/);
  assert.match(adr, /\| Status \| DRAFT — OWNER REVIEW REQUIRED \|/);
  for (let number = 1; number <= 20; number += 1) {
    const id = String(number).padStart(3, "0");
    assert.match(adr, new RegExp(`# ADR-${id} —`));
  }
  for (const section of ["Metadata", "Context", "Decision", "Rationale", "Alternatives Considered", "Consequences", "Invariants", "Change Conditions", "Migration / Rollback", "Evidence", "Current State"]) {
    assert.match(adr, new RegExp(`## ${section}`));
  }
  assert.match(adr, /PROPOSED — IMPLEMENTED BUT OWNER APPROVAL NOT VERIFIED/);
  assert.match(adr, /## Conflict Audit/);
});

test("glossary fixes required categories and critical distinctions", () => {
  const glossary = read("docs/governance/KEVIRIO_GLOSSARY.md");
  assert.match(glossary, /\| Version \| 1\.0 \|/);
  assert.match(glossary, /\| Status \| DRAFT — OWNER REVIEW REQUIRED \|/);
  for (const category of ["Product and Governance", "People and Roles", "Workspace and Permissions", "Business Entities", "Operations and Workflow", "Approval", "Evidence and Revenue", "AI Employee", "Provider and OAuth", "Cost and Quota", "Data and Architecture", "Security and Audit", "Environment and Release", "UI \/ UX", "Feature Maturity and Validation", "Error \/ State Semantics"]) {
    assert.match(glossary, new RegExp(`## ${category}`));
  }
  for (const term of ["Actual Revenue", "Forecast Revenue", "Mock Revenue", "Unknown", "Zero", "Approval", "Evidence", "External Execution"]) {
    assert.match(glossary, new RegExp(`\\*\\*${term}\\*\\*`));
  }
  assert.match(glossary, /Unknown vs Zero/);
  assert.match(glossary, /Approval Request vs Approval Decision/);
  assert.match(glossary, /Package creation vs External sending/);
  assert.match(glossary, /## Conflict Audit/);
});

test("all repository entry points reference ADR and glossary", () => {
  for (const path of ["docs/governance/KEVIRIO_GOVERNANCE_INDEX.md", "README.md", "AGENTS.md", "KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md", "docs/handover/KEVIRIO_DEVELOPMENT_RESTART_PROMPT.md"]) {
    const source = read(path);
    assert.match(source, /KEVIRIO_ARCHITECTURE_DECISION_RECORDS\.md/);
    assert.match(source, /KEVIRIO_GLOSSARY\.md/);
  }
});

test("design knowledge documents contain no credential values and preserve Owner approval", () => {
  const all = [
    read("docs/architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md"),
    read("docs/governance/KEVIRIO_GLOSSARY.md"),
  ].join("\n");
  assert.doesNotMatch(all, /sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/);
  assert.match(all, /Owner approval required/);
  assert.match(all, /not yet verified|Owner-approved|Owner acceptance/i);
});
