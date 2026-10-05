---
name: dutra-voice-studio
description: Route authorized DUTRA OS transcription, dictation and voice-production tasks through a local VoiceStudio workflow.
---
# DUTRA Voice Studio

External engine: debpalash/VoiceStudio (AGPL-3.0; model licenses may differ).

Use only for explicit audio/voice tasks such as:
- transcribing an authorized sales call or note;
- generating internal/commercial narration from approved text;
- dubbing/training material with authorized voices.

Do not make CRM core depend on VoiceStudio.
Do not commit recordings, generated voice models, customer audio, cookies, credentials or model weights.
Voice cloning requires explicit permission from the person whose voice is used.
Before commercial distribution, review the applicable VoiceStudio and model licenses.

Integration pattern:
DUTRA task -> local media workspace -> VoiceStudio local API/MCP -> output artifact -> explicit user review -> optional attachment to DUTRA library.
