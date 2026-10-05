# DUTRA OS — Agent Skills Runtime Map

This document connects the installed DUTRA skills to existing product boundaries without introducing fragile runtime coupling.

| Skill | DUTRA boundary | Optional external engine | Runtime policy |
|---|---|---|---|
| dutra-minimal-change | engineering workflow | Ponytail principles | instructions only |
| dutra-quote-engine | existing quote/proposal intelligence | none | reuse core logic |
| dutra-prospect-intelligence | Prospecting Engine/services | Obscura sandbox | adapter only |
| dutra-call-intelligence | Call AI + CRM interactions | VoiceStudio local | adapter only |
| dutra-content-studio | material library | VoiceStudio + video-use | offline/media worker |
| dutra-web-research | prospect research/QA | Obscura | optional sandbox |
| dutra-video-studio | content production | video-use | offline/media worker |
| dutra-voice-studio | transcription/narration | VoiceStudio | local worker |

## Architecture rule

External engines are capabilities behind adapters, not dependencies imported into the browser CRM bundle.

The product must continue operating when VoiceStudio, video-use or Obscura are absent.

## Connection contract

Every external execution should expose a narrow contract:

- input: explicit task payload + allowed source/media references;
- execution: isolated worker/local tool;
- output: normalized JSON/artifact;
- provenance: engine + version + source references;
- review: human or existing DUTRA validation step;
- persistence: only approved normalized business data/artifacts.

## Safety and data

Secrets live in environment/secret storage. Customer audio/video and browser profiles are not committed to Git. Public-web automation must not bypass access controls or platform enforcement.

## Deployment

Do not install Python/Rust/media stacks in the Railway CRM service merely to make a skill available. If a runtime engine is later needed in hosted operation, deploy it as an isolated worker/service with health checks, pinned versions and rollback.
