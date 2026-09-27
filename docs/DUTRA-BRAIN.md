# DUTRA BRAIN — compact entrypoint

> Fast orientation for humans and agents. This file is intentionally small. It does **not** replace the canonical Builder Brain in `docs/second-brain/`.

## What DUTRA OS is

DUTRA OS / Sistema OG is a commercial operating system for the Olho de Gato sales workflow. It combines daily queue, CRM, prospecting, quotation, Call AI, communication, performance and commercial context while preserving a local-first path and progressive migration toward canonical relational data.

## Product objective

Support the full commercial loop without turning AI into the database:

**find → qualify → contact → diagnose → propose → follow up → negotiate → sell → post-sale → expand → referral**

The system should make the next commercial action obvious, preserve history and data integrity, and reduce repeated manual context loading.

## Current architecture in one screen

- **Frontend:** PWA / vanilla JavaScript in `apps/sistema-og/`.
- **Local runtime:** Node server in `apps/sistema-og/server.mjs`.
- **Hosted preview:** protected Railway HTTPS runtime through `scripts/start-og-hosted.mjs`.
- **Canonical domain foundation:** Company, Contact, Opportunity, Activity and Task contracts exist as an additive migration layer.
- **Target canonical truth:** Supabase Postgres + Supabase Auth is the approved V1 direction; remote activation remains gated by environment validation.
- **Compatibility:** legacy lead/state paths remain supported while canonicalization advances through reviewed, reversible slices.
- **AI boundary:** AI consumes selective structured truth and proposes actions; important writes remain controlled/reviewed.

## Existing product surfaces

- Meu Dia / Mesa de Vendas
- CRM + searchable client list + editable client sheet
- Company 360 beta
- Prospecting engine
- Call AI
- Communication center and commercial templates
- Quotations / OG application workflow
- Material library
- Performance/funnel based on real events
- Spreadsheet preview/reconciliation
- Sync conflict review + durable outbox foundation
- Controlled legacy reconciliation
- Hosted preview with protected access and healthcheck

## Sources of truth

1. **Current code:** GitHub repository `ldutrald5/Dutra-Sales-OG-Sitem`, production branch `main`.
2. **Engineering/product memory:** canonical JSONL in `docs/second-brain/`; start from generated `BRAIN_INDEX.md`.
3. **Active decisions:** canonical history in `docs/second-brain/decisions.jsonl`; `docs/DECISIONS.md` is only a compact human entrypoint.
4. **Live runtime state:** Railway must be queried live through the runtime operator; docs are locators, not proof of health.
5. **Commercial source artifacts:** Drive/spreadsheets/proposals may be evidence or import sources, but they are not automatically canonical CRM truth until reconciled through the approved data path.
6. **Secrets:** Railway/provider secret stores only. Never Git, second brain or docs.

## Contracts that must not be broken

- Evolve incrementally; no big-bang rewrite.
- Preserve legacy data and stable IDs; migrations must be additive/reversible.
- Never silently delete localStorage, IndexedDB or real operational data.
- One entity should have one canonical identity across views.
- Opening WhatsApp is not proof that a message was sent.
- AI suggestions are not factual commercial events until confirmed.
- Conflicts and legacy reconciliation require human review when evidence is ambiguous.
- Hosted filesystem/JSON must not be reclassified as final canonical persistence.
- Reuse existing modules before creating parallel implementations.
- Small fixes must not trigger unrelated broad refactors.

## Minimal session start

1. Read this file.
2. Read `docs/CURRENT.md`.
3. Read `docs/DECISIONS.md` only when the task touches a decision boundary.
4. Follow `docs/DUTRA-PROTOCOL.md`.
5. Load scoped module docs/code only when required.

For structural work, activate the existing `dutra-builder-brain` skill and start from `docs/second-brain/BRAIN_INDEX.md`.
For Railway/deploy/domain/log/runtime questions, activate `dutra-runtime-operator` and verify the provider live.

## Detailed references

- Project context: `docs/PROJECT-CONTEXT.md`
- Architecture: `docs/01-ARQUITETURA.md`
- Data: `docs/02-BANCO-DE-DADOS.md`
- UX/design: `docs/03-DESIGN-SYSTEM.md`
- CRM: `docs/04-CRM.md`
- Sales desk: `docs/05-MESA-DE-VENDAS.md`
- Roadmap: `docs/10-ROADMAP.md`
- Runtime locator: `docs/runtime/DUTRA_OS_RUNTIME.md`
- Durable brain: `docs/second-brain/`
