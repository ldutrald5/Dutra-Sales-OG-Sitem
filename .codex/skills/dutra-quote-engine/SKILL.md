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

Flow:
account context → technical engine → pricing/calculation → manual review/override → proposal snapshot → explicit export/send.
