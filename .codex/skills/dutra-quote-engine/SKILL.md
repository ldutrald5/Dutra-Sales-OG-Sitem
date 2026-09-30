---
name: dutra-quote-engine
description: Operate and evolve DUTRA OS quotation/proposal intelligence by reusing the existing OG business logic.
---
# DUTRA Quote Engine

Purpose: connect agent work to the existing quotation/proposal intelligence without duplicating formulas or OG mappings.

Rules:
1. Locate and reuse existing quotation, proposal-intelligence, product/application and CRM code before changing anything.
2. Treat approved OG project data as source of truth for product codes, pressures, vehicle applications and prices. Never infer missing mappings.
3. Separate calculation/business rules from UI.
4. A quote mutation must preserve client/account context, vehicle configuration, items, quantities, totals, payment terms and history where those fields exist.
5. Run existing proposal/quotation regression tests after any change.
6. Do not make VoiceStudio/video/browser tools dependencies of quotation runtime.
7. Human review remains required before sending a commercial proposal externally.

Agent flow:
client context -> existing quote rules -> calculation -> validation -> proposal intelligence -> preview -> explicit send/export action.
