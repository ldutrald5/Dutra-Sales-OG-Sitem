
-- Sales Execution P0: additive schema over existing CRM/proposal tables.
alter table public.companies
  add column if not exists relationship_status text not null default 'UNKNOWN'
  check (relationship_status in ('UNKNOWN','COLD','KNOWS_OG','PREVIOUS_CONTACT','PREVIOUS_PROPOSAL','NEGOTIATION','CUSTOMER','INACTIVE_CUSTOMER'));

create index if not exists companies_relationship_status_idx
  on public.companies (relationship_status);

alter table public.crm_contacts
  add column if not exists whatsapp_e164 text,
  add column if not exists role_category text not null default 'UNKNOWN'
    check (role_category in ('GATEKEEPER','OPERATIONAL','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT','DIRECTOR','OWNER','UNKNOWN')),
  add column if not exists influence_level smallint not null default 0
    check (influence_level between 0 and 5),
  add column if not exists notes text;

create unique index if not exists crm_contacts_email_lower_uq
  on public.crm_contacts (lower(email))
  where email is not null and btrim(email) <> '';

create index if not exists crm_contacts_role_category_idx
  on public.crm_contacts (role_category);

alter table public.sales_opportunities
  add column if not exists pipeline_stage text not null default 'PROSPECT'
    check (pipeline_stage in (
      'PROSPECT','CONTACT_ATTEMPTED','CONNECTED','DECISION_MAKER_IDENTIFIED',
      'DECISION_MAKER_CONTACTED','QUALIFIED','MEETING_TO_SCHEDULE',
      'MEETING_SCHEDULED','MEETING_COMPLETED','PROPOSAL','NEGOTIATION','WON','LOST'
    )),
  add column if not exists relationship_status text not null default 'UNKNOWN'
    check (relationship_status in ('UNKNOWN','COLD','KNOWS_OG','PREVIOUS_CONTACT','PREVIOUS_PROPOSAL','NEGOTIATION','CUSTOMER','INACTIVE_CUSTOMER')),
  add column if not exists next_action_type text
    check (next_action_type is null or next_action_type in ('CALL','WHATSAPP','MEETING','FOLLOW_UP','SEND_MATERIAL','CREATE_PROPOSAL','PROPOSAL_FOLLOW_UP','CUSTOMER_EXPANSION')),
  add column if not exists next_action_reason text,
  add column if not exists next_action_priority text
    check (next_action_priority is null or next_action_priority in ('LOW','MEDIUM','HIGH','URGENT'));

create index if not exists sales_opportunities_pipeline_stage_v2_idx
  on public.sales_opportunities (pipeline_stage);
create index if not exists sales_opportunities_next_action_type_due_idx
  on public.sales_opportunities (next_action_type, next_action_due_at)
  where next_action_due_at is not null;

create table if not exists public.lead_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 180),
  source text,
  source_owner text,
  owner_user_id uuid,
  imported_at timestamptz not null default now(),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','ARCHIVED')),
  total_count integer not null default 0 check (total_count >= 0),
  worked_count integer not null default 0 check (worked_count >= 0),
  meetings_count integer not null default 0 check (meetings_count >= 0),
  proposals_count integer not null default 0 check (proposals_count >= 0),
  sales_count integer not null default 0 check (sales_count >= 0),
  pipeline_value numeric(14,2) not null default 0 check (pipeline_value >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lead_lists(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary_contact_id uuid references public.crm_contacts(id) on delete set null,
  position integer,
  work_status text not null default 'AVAILABLE'
    check (work_status in ('AVAILABLE','IN_PROGRESS','WORKED','SKIPPED')),
  enrichment_status text not null default 'PENDING'
    check (enrichment_status in ('PENDING','PROCESSING','READY','FAILED')),
  briefing_cache jsonb not null default '{}'::jsonb,
  briefing_valid_until timestamptz,
  last_attempt_at timestamptz,
  worked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, company_id)
);

create index if not exists lead_list_members_list_status_idx
  on public.lead_list_members (list_id, work_status, position);
create index if not exists lead_list_members_company_idx
  on public.lead_list_members (company_id);
create index if not exists lead_list_members_enrichment_idx
  on public.lead_list_members (enrichment_status);

create table if not exists public.prospecting_sessions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lead_lists(id) on delete restrict,
  seller_id uuid,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','PAUSED','COMPLETED','CANCELLED')),
  target_calls integer not null check (target_calls > 0),
  attempted_calls integer not null default 0 check (attempted_calls >= 0),
  connected_calls integer not null default 0 check (connected_calls >= 0),
  decision_makers_reached integer not null default 0 check (decision_makers_reached >= 0),
  qualified_opportunities integer not null default 0 check (qualified_opportunities >= 0),
  meetings_booked integer not null default 0 check (meetings_booked >= 0),
  proposals_created integer not null default 0 check (proposals_created >= 0),
  sales_created integer not null default 0 check (sales_created >= 0),
  current_member_id uuid references public.lead_list_members(id) on delete set null,
  session_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists prospecting_sessions_one_active_per_seller_idx
  on public.prospecting_sessions (seller_id)
  where seller_id is not null and status = 'ACTIVE';
create index if not exists prospecting_sessions_list_started_idx
  on public.prospecting_sessions (list_id, started_at desc);

create table if not exists public.call_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.prospecting_sessions(id) on delete set null,
  list_member_id uuid references public.lead_list_members(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  phone_e164 text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  outcome text not null
    check (outcome in (
      'NO_ANSWER','INVALID_NUMBER','GATEKEEPER','DECISION_MAKER_IDENTIFIED',
      'DECISION_MAKER_REACHED','RETURN_LATER','QUALIFIED','MEETING_BOOKED',
      'SEND_MATERIAL','PROPOSAL','NOT_INTERESTED'
    )),
  connected boolean not null default false,
  decision_maker_reached boolean not null default false,
  qualified boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists call_attempts_session_idx
  on public.call_attempts (session_id, created_at desc);
create index if not exists call_attempts_company_idx
  on public.call_attempts (company_id, created_at desc);
create index if not exists call_attempts_contact_idx
  on public.call_attempts (contact_id, created_at desc);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  opportunity_id uuid references public.sales_opportunities(id) on delete set null,
  primary_contact_id uuid references public.crm_contacts(id) on delete set null,
  seller_id uuid,
  meeting_status text not null default 'MEETING_SCHEDULED'
    check (meeting_status in ('MEETING_TO_SCHEDULE','MEETING_SCHEDULED','MEETING_CONFIRMED','MEETING_COMPLETED','NO_SHOW','RESCHEDULED','CANCELLED')),
  meeting_type text,
  mode text not null default 'ONLINE'
    check (mode in ('ONLINE','PRESENCIAL','PHONE')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  objective text,
  notes text,
  participants jsonb not null default '[]'::jsonb,
  confirmation_message text,
  follow_up_at timestamptz,
  calendar_provider text,
  calendar_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_company_scheduled_idx
  on public.meetings (company_id, scheduled_at desc);
create index if not exists meetings_status_scheduled_idx
  on public.meetings (meeting_status, scheduled_at);
create index if not exists meetings_opportunity_idx
  on public.meetings (opportunity_id);

create table if not exists public.ai_briefings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  opportunity_id uuid references public.sales_opportunities(id) on delete set null,
  session_id uuid references public.prospecting_sessions(id) on delete set null,
  mode text not null
    check (mode in ('GATEKEEPER','DECISION_MAKER','MEETING','CUSTOMER','FOLLOW_UP','PROPOSAL')),
  processing_status text not null default 'PENDING'
    check (processing_status in ('PENDING','PROCESSING','READY','FAILED')),
  source_fingerprint text,
  briefing jsonb not null default '{}'::jsonb,
  valid_until timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_briefings_company_mode_idx
  on public.ai_briefings (company_id, mode, created_at desc);
create index if not exists ai_briefings_status_idx
  on public.ai_briefings (processing_status, created_at);

alter table public.lead_lists enable row level security;
alter table public.lead_list_members enable row level security;
alter table public.prospecting_sessions enable row level security;
alter table public.call_attempts enable row level security;
alter table public.meetings enable row level security;
alter table public.ai_briefings enable row level security;

comment on table public.lead_lists is 'Operational prospecting collections; companies remain canonical in public.companies.';
comment on table public.lead_list_members is 'Membership of canonical companies in prospecting lists; does not duplicate account data.';
comment on table public.prospecting_sessions is 'Persistent seller prospecting sessions and conversion counters.';
comment on table public.call_attempts is 'Normalized call outcomes linked to session, company and optional contact.';
comment on table public.meetings is 'Sales meeting lifecycle prepared for future calendar adapters.';
comment on table public.ai_briefings is 'Cached contextual call briefings; external actions always require explicit user confirmation.';
