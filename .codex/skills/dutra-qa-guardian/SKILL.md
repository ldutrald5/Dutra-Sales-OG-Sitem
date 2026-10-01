---
name: dutra-qa-guardian
description: DUTRA OS regression and project-memory guardian. Use for bug fixes, QA, release gates, incident analysis, regression design and checking whether a proposed change repeats a known failure.
metadata:
  short-description: Incidents → prevention → regression protection
---

# DUTRA QA / Guardian

## Load
- `docs/second-brain/incidents.jsonl`
- `docs/second-brain/anti-patterns.jsonl`
- relevant tests and story/commit
- `AGENTS.md` quality gates.

## Incident method
BUG → symptom → context → root cause → fix → prevention rule → regression test → status/provenance.

## Pre-flight
- Has this symptom happened before?
- Does the proposed fix recreate an anti-pattern?
- Which alternate UI/service path can bypass the canonical contract?
- Is the test exercising the actual failure mode?
- Are blocked/not-run tests being reported truthfully?

## Guardrails
- No PASS without execution evidence.
- No metric test with mixed populations.
- No technical fallback that fabricates data.
- No silent sync overwrite.
- No release claim from remembered runtime state.

## Output
Incident ID, reproduced/not reproduced, root cause/evidence, prevention, regression coverage, residual risk and gate result.
