# CONVERGENCE-01 — Stage 2 shell audit

PRE_STAGE2_SHA / ROLLBACK: 331fca8984f85cb420de313f9a3e513366c45c44

Environment: integration branch, clean checkout, local/remote equal; authenticated dry-run passed with hooks. Matrix closed before runtime edits (2026-10-05).

| ELEMENT | CURRENT FUNCTIONAL OWNER | V3 UX REFERENCE | TARGET | DECISION |
|---|---|---|---|---|
| Entry / first paint | index.html; app.js DOMContentLoaded | static premium shell; INC-V3-BLACK-001 | static independent header/navigation; local startup feedback | ADAPT |
| Route / state | switchTab, hash/history, state.currentTab | go / screen selection | keep existing route IDs/history; reflect selection in shell | KEEP |
| Desktop navigation | nav-tabs-container / desktop Mais | premium active markers and compact labels | persistent sidebar, full-width workspace | ADAPT |
| Mobile navigation | initUnifiedExperience / og-mobile-nav | fixed bottom nav / command overlay | same contract; static bottom nav + accessible More drawer | MERGE |
| Tablet | breakpoint 768 | phone-centered shell | bottom navigation below 1024; sidebar above | ADAPT |
| Header | brand-header / install button | brand/topBar | DUTRA OS brand, current area, existing sync badge | MERGE |
| Workspace | main / tab-content | screen / cards | responsive available width, no phone-width desktop cap | ADAPT |
| Tokens | styles.css --og-* | black, graphite, yellow / editorial hierarchy | reuse canonical OG tokens, scoped shell spacing | KEEP |
| Modal / drawer | openAppDialog, closeAppDialog / client sheet | overlays | preserve controllers; shell drawer Escape/outside/focus | KEEP |
| Loading / error | existing renderers / notifications | localized feedback | startup state independent of domain bootstrap; module errors localized | ADAPT |
| Empty / success | domain renderers / og-toast | premium operational cards | shared existing surfaces/status palette; no fabricated data | KEEP |
| Offline / sync / conflict | setSyncStatus, recovery, outbox, conflict review | status chips | existing single status contract in header | ADAPT |
| PWA | service-worker.js v67 / DB v2 | first-paint lesson | cache shell files + version bump only, unchanged strategies/DB | ADAPT |
| CRM / Clientes / Pós-venda | crm + canonical client sheet + customer journey | V3 client screen | one CRM entry; existing capabilities as internal bridge | DEFER |
| Multi-Veículos / Propostas | cotacao + print/tracking | V3 application/proposal | one workspace entry; existing capabilities as internal bridge | DEFER |
| Sales Execution / Call Intelligence | existing launchers and services | preview services | preserve behavior; no domain migration | KEEP |
| Meu Dia | current dashboard/prioritization | premium home | shell only, no Mission Control redesign | DEFER |

## Implementation boundaries

Use static shell markup, a small scoped shell CSS/component and the existing navigation controller. Do not add a router, global store, sync model or business engine. Desktop and mobile controls represent the same canonical routes. CRM contains Clientes/Pós-venda; Cotação contains Multi-Veículos/Propostas: these are capabilities, not duplicate routes or competing applications. No mock V3 data is imported.

TEMPORARY_INTERNAL_BRIDGE: CRM/Clientes/Pós-venda (existing CRM/client sheet/journey; CRM owner; subsequent CRM/Client 360/post-sale stages); Multi-Veículos/Propostas (existing quote/proposal; quote owner; subsequent technical/proposal stages); Sales Execution and Call Intelligence (existing launchers/services; respective owners; subsequent module stages). Meu Dia remains unchanged for Stage 3.

No Supabase, production, original V3/V2 or protected reference changes. Test all eight requested viewports and offline/reconnect/history/refresh/keyboard/startup failures before completion. Quality conclusions are recorded after execution, not inferred from this matrix.

## Executed closure

Architect APPROVED; QA PASS. Two coherent implementation/regression commits: 748f800f5448f40fd03e3f2e428d0937f2e239e4 and be4b46ce4829ff18d193b6f8dfc34e671b52b8c4, published and verified. Full 75-gate suite plus eight-viewport browser gate, first-paint dependency failure, renderer recovery and cached PWA offline/real API reconnect passed. Overflow at 320px was corrected specifically in quote PDF selector/vehicle header; mobile nav hidden while dialog controller is active. Existing route ownership, local storage, IndexedDB/outbox and business services remain unchanged.

Bootstrap coordination decision: existing route restoration precedes remote sync; listeners and initial network status precede awaited recovery; SW update maintenance is independent; an ephemeral local startup promise orders online pull after initial recovery/import/pull. No second sync store, domain or router was introduced. Independent delayed-import online/offline race test passed.

Browser limitation: Chromium151/Playwright1.62.1 failed to emit online after cached offline reload despite real restored API transport. Gate explicitly simulates that event AFTER navigator.onLine=true and real /api/state200, then requires app's own acknowledgement. Non-SW contexts exercise ordinary network events. Do not report physical mobile network acceptance from this developer emulation.

Baseline debt: caught first-run syncRecoveryReady TDZ on empty lead storage remains identical to entry; no uncaught browser error in normal eight-viewport gate. Deep module UI and hardware/auth-hosted acceptance remain subsequent work; no Stage 3 execution performed.

Complete per-stage bridges, test evidence, protected refs, risk/rollback and File List: checkpoint/story.
