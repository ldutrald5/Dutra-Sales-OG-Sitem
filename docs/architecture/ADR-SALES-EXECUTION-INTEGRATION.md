# ADR — Sales Execution Integration

Status: PROPOSED / evidence-backed
Date: 2026-09-29

## Evidence inspected
The live Supabase project `hlyffyguxqxmgxlevfeq` already contains the Sales Execution schema and migrations:
- 20260929222041 add_sales_execution_p0
- 20260929222950 add_sales_execution_fk_indexes
- 20260929232101 add_sales_execution_external_ids

The repository currently contains the legacy/local-first PWA and does not version those three live migrations.

## Decision
Do not create a parallel Sales Execution product. Integrate the existing OG UI incrementally.

Target transition:
`OG UI → Sales Execution Adapter → Railway Trusted Gateway → token-authenticated Supabase Edge gateway → Supabase`.

The Edge gateway keeps Supabase administrative credentials inside Supabase-managed server runtime. Railway stores only a dedicated rotatable internal gateway token; neither the browser nor repository receives an admin/secret key.

The PWA remains local-first during migration. Supabase is the normalized architectural destination for Sales Execution entities; legacy `state.leads` remains a compatibility projection until reconciliation is proven.

## Existing-before-create
Do NOT recreate: lead_lists, lead_list_members, prospecting_sessions, call_attempts, meetings, ai_briefings, decision-maker tables, a second opportunity pipeline, or session_queue.

Queue is a projection of list members and the session cursor.

## Identity
`companies.legacy_lead_id` maps the current lead identity to normalized company identity. External IDs are used for idempotent integration. No list import may create a second company merely because the same company appears in another list.

## Security boundary
No privileged Supabase credential is allowed in the browser. Until Auth/RLS is deliberately activated and tested, privileged Sales Execution operations cross the Railway trusted boundary and then a dedicated Edge gateway. The Edge gateway authenticates Railway with a rotatable token whose hash is stored in `internal_service_tokens`; Supabase admin credentials remain inside the Edge runtime.

## Command path
Multi-entity business events should use one controlled domain command. Recording a call result may affect call_attempt, contact, opportunity, activity, meeting and session/member state. The client must not scatter those writes.

## Metrics
Denormalized counters are not canonical unless their maintenance mechanism is verified. P0 metrics are derived from facts.

## First vertical slice
List → Session → Next Account → Briefing → Call AI → Confirmed Result → Next Action/Meeting → Next Account.

## Rollback
The first integration package is adapter/gateway-only and must not delete local data, rewrite legacy IDs or make Supabase the only readable source. Feature flags/default-off behavior are required until end-to-end validation.
