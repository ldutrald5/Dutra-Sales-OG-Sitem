# Stage 3 — Meu Dia operational projection audit

ENTRY / PRE_STAGE3_SHA: 7527c4df5c9ea3e8bbf459227f665a1abb33fb91
Stage 2 published boundary: d948c355df11b236e48c7345c2f042ff93d879b4.
Governance sync: five audited commits, fast-forward, no app/Supabase changes.
Environment: clean integration checkout; governance brain/intelligence/syntax gates PASS;
remote write preflight PASS (Everything up-to-date). Publication still requires real push verification.

## Capability / owner matrix — closed before runtime edits

| Capability | Current owner / source | V3 UX reference | Target / decision |
|---|---|---|---|
| Client identity | crm-service / state.leads / lead.id, salesExecution.companyId | account rows, compact context | KEEP, one identity, no new CRM |
| Queue | OG_SALES_DESK.selectQueue, terminal exclusion and canonical sort | meu-dia-v3 compact action queue | ADAPT presentation; DO NOT DUPLICATE ranking |
| Priority / score | lead-intelligence.scoreBreakdown / sales-desk.score | priority explanation | KEEP; score is points, never an invented percentage |
| NBA | lead-intelligence.nextBestAction / explicit nextAction metadata | actionable now card | KEEP; incomplete context prompts review, terminal leads excluded |
| Follow-up | interaction-service.setNextAction / lead.followUpAt | overdue/today/upcoming sections | ADAPT projection; no agenda persistence |
| Local outcomes | RESULT_DEFINITIONS / recordResult / persistSalesDeskActivity | quick outcome workflow | KEEP taxonomy; prevent repeated UI submission; terminal result clears commitments |
| Normalized outcomes | CallAI review / syncApprovedCallToSalesExecution / atomic recordCallResult | execution action center | KEEP command path, internal bridge; never write a parallel Mesa outcome |
| Meetings | explicit reviewed CallAI booking / canonical meeting command | upcoming commitments | MERGE confirmed structured metadata into existing call.saved activity; no inference from follow-up or text |
| Calendar | morning-command calendarConnected=false; connector health requires configuration | calendar-provider UI | DEFER integration; distinguish disconnected from empty |
| Proposals | proposal-intelligence normalized event types / operations.activityEvents and quotes | proposal movement | ADAPT facts only; prepared != sent; CRM status and WhatsApp-open are insufficient evidence |
| Tasks | operations.tasks, canonical task dueAt/status/companyId | work queue | KEEP readonly open-task projection; no second task store |
| Alerts / briefing | signal-center, automation-engine, morning-command | operational briefing | KEEP under collapsed support; not a second lane/priority engine |
| Client context | existing sales-desk-client / client sheet | compact account panel | ADAPT, full 360 deferred Stage 4 |
| Technical / proposal actions | existing quote client application and guia/cotacao routes | direct action buttons | KEEP owners; no engine copy |
| Offline / sync / conflict | existing storage/outbox/sync-conflict service and shell status | global operational feedback | KEEP contracts; no new outbox or silent overwrite |
| Navigation / first paint | Stage 2 shell / switchTab | premium navigation | KEEP; no AI/network dependency in projection |

## Findings requiring bounded fixes

- getDayGroups excluded only fechado whereas queue excludes fechado/perdido: counters must use the queue owner's same eligible population.
- Selected client was validated against all CRM records instead of the eligible queue, leaving a terminal client selected after an outcome.
- venda did not clear the former follow-up. Fix in the existing canonical outcome definition, not a UI-only alternate rule.
- enviar_orcamento is a historical CRM status mapping, not authoritative proof of proposal delivery. Proposal movement must read factual proposal events.
- Account-context readers do not currently expose canonical meetings. Existing call.saved can preserve explicit reviewed meeting metadata; historical bookings without a date must say date unavailable. No Supabase changes.
- Local Mesa save needs a per-render submission guard; normalized records must go through the existing reviewed command owner.

Architect boundary approved: readonly projection consumes existing queue/NBA, same deduplicated population for counts and rows; structured meeting metadata in existing confirmed activity permitted. No new schema, score, agenda, CRM, execution engine or calendar integration.

## Packages / QA

3A audit; 3B–3D readonly Agora/queue/commitments; 3E–3F canonical actions/result loop; 3G responsive presentation; 3H deterministic and browser regressions. Test each coherent package. Eight requested viewports; real local persistence and sync; proposal/terminal/dedup/meeting semantic fixtures. All fixture data artificial and isolated from production. Stage 4 remains prohibited.
