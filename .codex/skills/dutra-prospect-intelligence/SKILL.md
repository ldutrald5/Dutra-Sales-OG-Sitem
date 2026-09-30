---
name: dutra-prospect-intelligence
description: Connect agent research to DUTRA OS prospecting intake, research, review and CRM flows.
---
# DUTRA Prospect Intelligence

Reuse the existing Prospecting Engine and prospecting services. Do not create a parallel lead database.

Research adapter priority:
1. existing DUTRA/web provider;
2. approved public-web research tooling;
3. optional Obscura sandbox only when the normal provider cannot satisfy an authorized workflow.

Required output contract for researched facts:
- company/account identity;
- business-relevant fact;
- source/provenance;
- observed/retrieved timestamp when available;
- confidence/verification state;
- proposed CRM action, never silent destructive overwrite.

Do not bypass authentication/CAPTCHA/blocks, scrape sensitive personal data, or use anti-detection to evade platform enforcement.
Research suggestions must pass review/normalization before becoming canonical CRM data.
