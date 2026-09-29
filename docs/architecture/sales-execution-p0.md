# Sales Execution Sprint — P0 architecture

## Brownfield audit

The existing system is preserved. The V3 premium shell remains a compatibility layer over the hosted DUTRA OS state, while the connected Supabase project now contains canonical commercial entities for proposal/CRM work.

Existing canonical tables reused instead of duplicated:
- companies -> accounts
- crm_contacts -> people/contact map
- sales_opportunities -> opportunity + next action
- crm_activities -> activities/tasks
- proposals -> proposals

Existing strengths found:
- CNPJ uniqueness already exists on companies.
- phone_e164 uniqueness already exists on crm_contacts.
- sales_opportunities already has company/contact foreign keys and next_action_due_at.
- crm_activities already supports call/message/follow_up/meeting/proposal/note/task.
- proposal and enrichment infrastructure already exists.

Gaps addressed additively:
- relationship_status independent from pipeline.
- richer contact role map.
- operational lead lists and list members.
- persistent prospecting sessions.
- normalized call attempts.
- meeting lifecycle.
- cached contextual AI briefings.
- pipeline_stage v2 and typed next best action fields.

## Security posture

All new public tables have RLS enabled. No permissive browser policies are added in this sprint because the current V3 login is still the hosted DUTRA OS access PIN, not Supabase Auth. Runtime writes continue through the existing protected hosted state until the Supabase Auth pilot is deliberately activated.

## Runtime strategy

P0 uses the existing Railway state as a compatibility persistence layer so tomorrow's workflow is not blocked by an auth migration. The same concepts are mirrored in versioned PostgreSQL schema for the canonical future bridge.

No existing CRM, proposal, authentication, Call AI, reporting, history or hosted state endpoints are removed.
