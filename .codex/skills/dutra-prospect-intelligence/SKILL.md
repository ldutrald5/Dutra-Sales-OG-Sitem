---
name: dutra-prospect-intelligence
description: Connect agent research to DUTRA OS prospecting intake, research, review and CRM flows.
---
# DUTRA Prospect Intelligence

Use with `dutra-core`, `dutra-crm` and `dutra-sales`.

Do not create a parallel lead database. Smart views and lead lists reference the central account identity.

## Research adapter priority

1. existing DUTRA/web provider;
2. approved public-web research tooling;
3. optional sandbox adapter only for an authorized gap.

## Output contract

- company/account identity;
- business-relevant fact;
- source/provenance;
- observed/retrieved timestamp when available;
- confidence/verification state;
- proposed CRM action.

Research output is a suggestion until normalized/reviewed. Preserve gatekeepers and newly discovered contacts instead of overwriting them.

Do not bypass authentication/CAPTCHA/blocks, collect sensitive personal data, or evade platform enforcement.

For conversation/approach after research, route to `docs/playbooks/SALES_PLAYBOOKS.md`.
