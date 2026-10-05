---
name: dutra-video-studio
description: Produce or edit DUTRA OG commercial/training video through an agent-assisted video-use workflow.
---
# DUTRA Video Studio

External engine: browser-use/video-use (MIT).

Use for approved media-production work: cuts, captions, resizing, training clips, product demos and sales content.
Keep this tooling outside the CRM runtime.
Its environment may require ffmpeg and optional transcription credentials. Secrets belong in environment/secret storage, never Git.
Do not publish customer footage or identifiable recordings without authorization.
All generated commercial claims about OG must be grounded in approved project knowledge; do not invent technical specs, savings or applications.

Workflow:
source media -> edit plan -> agent/video-use processing -> local preview -> human approval -> export -> optional DUTRA material-library registration.
