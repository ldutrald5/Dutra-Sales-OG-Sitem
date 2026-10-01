---
name: dutra-call-intelligence
description: Connect authorized call audio/transcripts to DUTRA OS Call AI, commercial playbooks and reviewed CRM follow-up intelligence.
---
# DUTRA Call Intelligence

Use with `dutra-sales` + `dutra-crm` and `docs/06-CALL-AI.md`.

Pipeline:
authorized audio/transcript → transcription when needed → normalize → account context → Call AI/playbook mode → extract pains/objections/commitments/next action → REVIEW_REQUIRED → explicit CRM commit.

## Mode routing

Use relationship/person/stage to select Gatekeeper, Decision Maker, Meeting, Customer, Follow-up or Proposal behavior from `docs/playbooks/SALES_PLAYBOOKS.md`.

## Privacy and truth

- do not commit recordings/transcripts to Git;
- voice cloning is not call analysis and requires explicit permission;
- preserve provenance from transcript/source to derived note;
- never store an AI inference as client speech without review;
- if transcription is unavailable, accept user-provided transcript and keep the same downstream contract.

Optional transcription engines must not become required CRM dependencies.
