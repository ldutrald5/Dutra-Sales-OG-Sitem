---
name: dutra-quote-engine
description: Operate and evolve DUTRA OS quotation/proposal intelligence by reusing the existing OG business logic.
---
# DUTRA Quote Engine

Use with `dutra-core`; add `dutra-og-tech` for application/parts and `dutra-sales` for commercial framing.

## Sources

- existing quote/proposal intelligence;
- `preview-v2/technical-application-core-v3.js` for technical application;
- current pricing/catalog data;
- CRM account context.

## Rules

1. Search and reuse existing quotation/proposal/application code before changing logic.
2. Never duplicate OG mappings in UI/prompt code.
3. Missing or ambiguous technical mapping = VALIDAR.
4. Preserve client, vehicle configuration, item origin, quantities, totals, terms and history.
5. Automatic calculation must remain manually editable for legitimate exceptions.
6. Quote creation is not proposal send/acceptance.
7. Human review is required before external commercial send.
8. Run quote/technical/proposal regressions after changes.
9. ROI consumes explicitly sourced/reviewed scenario premises through OG_PROPOSAL_INTELLIGENCE.calculateRoi; missing premises = VALIDAR. Never assume universal tire/fuel gain, cycle, payback or guaranteed return.
10. Prepared proposal revisions retain bounded immutable quote prices, quantities, vehicle IDs and application provenance; no whole CRM/history/state. A late publication response belongs only to the originally captured proposal/client/quote identity.

11. Client print/PDF/PNG and templates consume the same snapshot-derived presentation view model. Changes to sections/text/logo create a new presentation revision from the original frozen snapshot, never reprice or recalculate ROI.
12. Logos use approved customer-authorized material references scoped to the canonical client; retain a content fingerprint, never duplicate binary assets in snapshots or fetch remote logos during export. Missing/changed assets use explicit OG-only fallback.
13. Export only the client presentation surface with bounded semantic pages; inspect actual PDFs and PNG pixels, including logo and page count. Guard async exports with captured client/proposal identity. Export/download never records SENT.
14. The primary proposal UX is story-first and block-based, not A4-first. One frozen canonical proposal view model feeds reusable presentation blocks such as Hero, Context, Fleet, Application, Investment, ROI, Conditions and Next Step.
15. Keep content, block order/visibility, theme tokens, media references and template composition editable independently from business logic. A new visual template must not duplicate quote, technical, pricing or ROI calculations.
16. Optimize the first viewport for rapid comprehension; move exhaustive technical evidence into progressive-detail sections when the chosen template allows it.
17. "Professional" does not require a generic white report. Distinctive OG presentation may use dark/light section contrast, secondary accents, imagery and expressive hierarchy when selected through the product visual-direction process. Export formats remain readable and deterministic.
18. Gamma is a UX/editability benchmark only. Do not make canonical proposal generation depend on Gamma or export customer data to external design tools without an explicit future integration decision.

Flow:
account context → technical engine → pricing/calculation → manual review/override → proposal snapshot → explicit export/send.
