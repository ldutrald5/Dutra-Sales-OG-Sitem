# Sales Execution Contract — P0

## Legacy ↔ normalized mapping

| Current OG | Normalized Sales Execution |
|---|---|
| lead.id | companies.legacy_lead_id |
| lead company fields | companies |
| lead contact fields | crm_contacts |
| lead status/opportunity | sales_opportunities |
| lead.interactions call result | call_attempts + crm_activities |
| source/batch queue | lead_lists + lead_list_members |
| focus-mode session | prospecting_sessions |
| next action/follow-up | sales_opportunities + crm_activities |
| meeting commitment | meetings |
| Call AI cached preparation | ai_briefings |
| quotation/proposal | proposals |

## Adapter envelope
The UI-facing adapter should converge on:
```json
{
  "company": {},
  "contact": {},
  "opportunity": {},
  "listMember": {},
  "session": {},
  "briefing": {},
  "recentActivities": []
}
```

Call AI receives a compact projection of this envelope, not the full database.

## Domain command: record-call-result
Input must identify the company and idempotency/external event plus confirmed outcome. Optional confirmed fields may include contact/decision-maker data, qualification, next action and meeting.

Server responsibilities:
1. validate identity and allowed result;
2. resolve canonical company/contact/member/session;
3. insert/idempotently resolve call attempt;
4. update only explicitly confirmed contact facts;
5. advance opportunity only when the result contract permits;
6. create activity/next action;
7. create meeting only for a confirmed booking;
8. update member/session cursor;
9. return the next normalized context.

Never infer a sent message, answered call, meeting or sale from UI navigation.

## Call AI modes
Modes are context configurations of one Call AI, not independent agents:
- GATEKEEPER → reach_decision_maker
- DECISION_MAKER → prepare/live call
- MEETING → prepare_call / next_action
- CUSTOMER → post-call / expansion context
- FOLLOW_UP → follow_up
- PROPOSAL → negotiate / follow_up / close

## Compatibility
During P0, existing local interaction recording remains available as fallback. Dual-write, if introduced, must be explicit, idempotent and observable; silent dual-write is prohibited.


## P0 transactional write path
The reviewed migration `20260930024500_record_sales_execution_result_v1.sql` introduces `record_sales_execution_result_v1(jsonb)`.

The function is `SECURITY DEFINER`, has a fixed search path, revokes execution from public/anon/authenticated, and grants execution only to `service_role`. The browser cannot call it directly. Railway reaches it through the token-authenticated `sales-execution-gateway` Edge Function.

It atomically records the call attempt, activity, allowed opportunity progression, confirmed meeting, worked list member and next session cursor. Mandatory external id provides retry/idempotency protection.

Production migration applied successfully on 2026-09-30. The `sales-execution-gateway` Edge Function is deployed. Railway has its Edge URL and a dedicated server-only gateway token configured with deployment intentionally skipped until this branch is released.