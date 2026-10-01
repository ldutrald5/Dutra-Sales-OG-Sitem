---
name: dutra-call-intelligence
description: Connect authorized call audio/transcripts to DUTRA OS Call AI and CRM follow-up intelligence.
---
# DUTRA Call Intelligence

Use existing Call AI/context/prompt/communication services as the product boundary.

Optional transcription adapter: local VoiceStudio for audio the user is authorized to process.
Never make VoiceStudio a required CRM runtime dependency.

Pipeline:
authorized audio or transcript -> transcription (when needed) -> normalize transcript -> existing Call AI analysis -> extract objections/needs/commitments/next action -> human review -> CRM interaction/follow-up.

Privacy:
- do not commit recordings/transcripts to Git;
- use temporary/local media workspace unless explicit approved storage exists;
- voice cloning is not part of call analysis;
- do not clone a person's voice without explicit permission;
- preserve provenance between transcript and derived CRM notes.

If transcription is unavailable, accept a user-provided transcript and continue through the same downstream contract.
