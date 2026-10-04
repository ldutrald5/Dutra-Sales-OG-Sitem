-- Recovery supplement for live schema objects not represented in
-- supabase_migrations.schema_migrations on 2026-10-03.
--
-- Provenance: reconstructed from live pg_catalog/information_schema for the
-- eight public tables that existed remotely but had no CREATE TABLE statement
-- in the recorded migration history.
--
-- This is NOT an applied production migration. It exists only to make a
-- disposable fresh replay truthful and reviewable.

create table if not exists public.crm_contacts (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  provider text not null default 'kaption'::text,
  external_contact_id text,
  full_name text,
  phone_e164 text,
  email text,
  role_title text,
  decision_level text not null default 'unknown'::text,
  source text not null default 'whatsapp'::text,
  source_metadata jsonb not null default '{}'::jsonb,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  whatsapp_e164 text,
  role_category text not null default 'UNKNOWN'::text,
  influence_level smallint not null default 0,
  notes text,
  legacy_contact_id text,
  constraint crm_contacts_pkey primary key (id),
  constraint crm_contacts_provider_external_contact_id_key unique (provider, external_contact_id),
  constraint crm_contacts_decision_level_check check (decision_level = any (array['decision_maker'::text,'influencer'::text,'user'::text,'gatekeeper'::text,'unknown'::text])),
  constraint crm_contacts_influence_level_check check (influence_level >= 0 and influence_level <= 5),
  constraint crm_contacts_role_category_check check (role_category = any (array['GATEKEEPER'::text,'OPERATIONAL'::text,'FLEET_MANAGER'::text,'MAINTENANCE_MANAGER'::text,'PROCUREMENT'::text,'DIRECTOR'::text,'OWNER'::text,'UNKNOWN'::text]))
);

create table if not exists public.crm_conversations (
  id uuid not null default gen_random_uuid(),
  provider text not null default 'kaption'::text,
  channel text not null default 'whatsapp'::text,
  external_thread_id text not null,
  company_id uuid,
  contact_id uuid,
  chat_type text not null default 'direct'::text,
  title text,
  status text not null default 'open'::text,
  last_message_at timestamptz,
  summary text,
  summary_updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_conversations_pkey primary key (id),
  constraint crm_conversations_provider_external_thread_id_key unique (provider, external_thread_id),
  constraint crm_conversations_chat_type_check check (chat_type = any (array['direct'::text,'group'::text,'unknown'::text])),
  constraint crm_conversations_status_check check (status = any (array['open'::text,'archived'::text]))
);

create table if not exists public.crm_messages (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid not null,
  provider text not null default 'kaption'::text,
  external_message_id text not null,
  direction text not null,
  sender_external_id text,
  sender_name text,
  body text,
  message_type text not null default 'text'::text,
  sent_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint crm_messages_pkey primary key (id),
  constraint crm_messages_provider_external_message_id_key unique (provider, external_message_id),
  constraint crm_messages_direction_check check (direction = any (array['inbound'::text,'outbound'::text,'system'::text]))
);

create table if not exists public.sales_opportunities (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  primary_contact_id uuid,
  source_conversation_id uuid,
  source text not null default 'whatsapp'::text,
  stage text not null default 'lead'::text,
  fleet_size integer,
  fleet_source text,
  fleet_confidence numeric,
  vehicle_profile_id uuid,
  primary_pain text,
  objections jsonb not null default '[]'::jsonb,
  next_action text,
  next_action_due_at timestamptz,
  latest_proposal_id uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pipeline_stage text not null default 'PROSPECT'::text,
  relationship_status text not null default 'UNKNOWN'::text,
  next_action_type text,
  next_action_reason text,
  next_action_priority text,
  legacy_opportunity_id text,
  data_provenance jsonb not null default '{}'::jsonb,
  proposal_triggered_at timestamptz,
  constraint sales_opportunities_pkey primary key (id),
  constraint sales_opportunities_fleet_confidence_check check (fleet_confidence is null or fleet_confidence >= 0::numeric and fleet_confidence <= 1::numeric),
  constraint sales_opportunities_fleet_size_check check (fleet_size is null or fleet_size > 0),
  constraint sales_opportunities_next_action_priority_check check (next_action_priority is null or next_action_priority = any (array['LOW'::text,'MEDIUM'::text,'HIGH'::text,'URGENT'::text])),
  constraint sales_opportunities_next_action_type_check check (next_action_type is null or next_action_type = any (array['CALL'::text,'WHATSAPP'::text,'MEETING'::text,'FOLLOW_UP'::text,'SEND_MATERIAL'::text,'CREATE_PROPOSAL'::text,'PROPOSAL_FOLLOW_UP'::text,'CUSTOMER_EXPANSION'::text])),
  constraint sales_opportunities_pipeline_stage_check check (pipeline_stage = any (array['PROSPECT'::text,'CONTACT_ATTEMPTED'::text,'CONNECTED'::text,'DECISION_MAKER_IDENTIFIED'::text,'DECISION_MAKER_CONTACTED'::text,'QUALIFIED'::text,'MEETING_TO_SCHEDULE'::text,'MEETING_SCHEDULED'::text,'MEETING_COMPLETED'::text,'PROPOSAL'::text,'NEGOTIATION'::text,'WON'::text,'LOST'::text])),
  constraint sales_opportunities_relationship_status_check check (relationship_status = any (array['UNKNOWN'::text,'COLD'::text,'KNOWS_OG'::text,'PREVIOUS_CONTACT'::text,'PREVIOUS_PROPOSAL'::text,'NEGOTIATION'::text,'CUSTOMER'::text,'INACTIVE_CUSTOMER'::text])),
  constraint sales_opportunities_stage_check check (stage = any (array['lead'::text,'qualified'::text,'discovery'::text,'proposal'::text,'negotiation'::text,'won'::text,'lost'::text,'dormant'::text]))
);

create table if not exists public.crm_insights (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid,
  message_id uuid,
  opportunity_id uuid,
  insight_type text not null default 'conversation_snapshot'::text,
  facts jsonb not null default '{}'::jsonb,
  hypotheses jsonb not null default '{}'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  buying_signals jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  next_action text,
  confidence numeric,
  review_status text not null default 'pending'::text,
  model_name text,
  model_version text,
  source_message_ids jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint crm_insights_pkey primary key (id),
  constraint crm_insights_confidence_check check (confidence is null or confidence >= 0::numeric and confidence <= 1::numeric),
  constraint crm_insights_review_status_check check (review_status = any (array['pending'::text,'approved'::text,'rejected'::text,'auto_applied'::text]))
);

create table if not exists public.crm_processor_runs (
  id uuid not null default gen_random_uuid(),
  insight_id uuid not null,
  processor_version text not null default '1.0.0'::text,
  status text not null default 'started'::text,
  decision text,
  actions jsonb not null default '[]'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint crm_processor_runs_pkey primary key (id),
  constraint crm_processor_runs_insight_id_processor_version_key unique (insight_id, processor_version),
  constraint crm_processor_runs_status_check check (status = any (array['started'::text,'processed'::text,'skipped'::text,'failed'::text]))
);

create table if not exists public.crm_activities (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  contact_id uuid,
  conversation_id uuid,
  opportunity_id uuid,
  activity_type text not null,
  status text not null default 'pending'::text,
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  external_id text,
  source_insight_id uuid,
  constraint crm_activities_pkey primary key (id),
  constraint crm_activities_activity_type_check check (activity_type = any (array['call'::text,'message'::text,'follow_up'::text,'meeting'::text,'proposal'::text,'note'::text,'task'::text])),
  constraint crm_activities_status_check check (status = any (array['pending'::text,'completed'::text,'cancelled'::text]))
);

create table if not exists public.integration_events (
  id bigint generated by default as identity not null,
  source text not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text,
  raw_payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received'::text,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint integration_events_pkey primary key (id),
  constraint integration_events_source_external_event_id_key unique (source, external_event_id),
  constraint integration_events_processing_status_check check (processing_status = any (array['received'::text,'processed'::text,'ignored'::text,'failed'::text]))
);

alter table public.crm_contacts
  add constraint crm_contacts_company_id_fkey foreign key (company_id) references public.companies(id) on delete set null;

alter table public.crm_conversations
  add constraint crm_conversations_company_id_fkey foreign key (company_id) references public.companies(id) on delete set null,
  add constraint crm_conversations_contact_id_fkey foreign key (contact_id) references public.crm_contacts(id) on delete set null;

alter table public.crm_messages
  add constraint crm_messages_conversation_id_fkey foreign key (conversation_id) references public.crm_conversations(id) on delete cascade;

alter table public.sales_opportunities
  add constraint sales_opportunities_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade,
  add constraint sales_opportunities_latest_proposal_id_fkey foreign key (latest_proposal_id) references public.proposals(id) on delete set null,
  add constraint sales_opportunities_primary_contact_id_fkey foreign key (primary_contact_id) references public.crm_contacts(id) on delete set null,
  add constraint sales_opportunities_source_conversation_id_fkey foreign key (source_conversation_id) references public.crm_conversations(id) on delete set null,
  add constraint sales_opportunities_vehicle_profile_id_fkey foreign key (vehicle_profile_id) references public.vehicle_profiles(id) on delete set null;

alter table public.crm_insights
  add constraint crm_insights_conversation_id_fkey foreign key (conversation_id) references public.crm_conversations(id) on delete cascade,
  add constraint crm_insights_message_id_fkey foreign key (message_id) references public.crm_messages(id) on delete set null,
  add constraint crm_insights_opportunity_id_fkey foreign key (opportunity_id) references public.sales_opportunities(id) on delete set null;

alter table public.crm_processor_runs
  add constraint crm_processor_runs_insight_id_fkey foreign key (insight_id) references public.crm_insights(id) on delete cascade;

alter table public.crm_activities
  add constraint crm_activities_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade,
  add constraint crm_activities_contact_id_fkey foreign key (contact_id) references public.crm_contacts(id) on delete set null,
  add constraint crm_activities_conversation_id_fkey foreign key (conversation_id) references public.crm_conversations(id) on delete set null,
  add constraint crm_activities_opportunity_id_fkey foreign key (opportunity_id) references public.sales_opportunities(id) on delete set null,
  add constraint crm_activities_source_insight_id_fkey foreign key (source_insight_id) references public.crm_insights(id) on delete set null;

create index if not exists crm_activities_company_idx on public.crm_activities (company_id);
create index if not exists crm_activities_contact_idx on public.crm_activities (contact_id);
create index if not exists crm_activities_conversation_idx on public.crm_activities (conversation_id);
create index if not exists crm_activities_due_idx on public.crm_activities (status,due_at) where due_at is not null;
create unique index if not exists crm_activities_external_id_uq on public.crm_activities (external_id) where external_id is not null and btrim(external_id) <> '';
create unique index if not exists crm_activities_insight_type_full_uq on public.crm_activities (source_insight_id,activity_type);
create unique index if not exists crm_activities_insight_type_uq on public.crm_activities (source_insight_id,activity_type) where source_insight_id is not null;
create index if not exists crm_activities_opportunity_idx on public.crm_activities (opportunity_id);
create index if not exists crm_activities_source_insight_idx on public.crm_activities (source_insight_id);

create index if not exists crm_contacts_company_idx on public.crm_contacts (company_id);
create unique index if not exists crm_contacts_email_lower_uq on public.crm_contacts (lower(email)) where email is not null and btrim(email) <> '';
create unique index if not exists crm_contacts_legacy_contact_id_uq on public.crm_contacts (legacy_contact_id) where legacy_contact_id is not null and btrim(legacy_contact_id) <> '';
create unique index if not exists crm_contacts_phone_e164_uq on public.crm_contacts (phone_e164) where phone_e164 is not null;
create index if not exists crm_contacts_role_category_idx on public.crm_contacts (role_category);

create index if not exists crm_conversations_company_idx on public.crm_conversations (company_id);
create index if not exists crm_conversations_contact_idx on public.crm_conversations (contact_id);
create index if not exists crm_conversations_last_message_idx on public.crm_conversations (last_message_at desc);

create index if not exists crm_insights_conversation_idx on public.crm_insights (conversation_id,created_at desc);
create index if not exists crm_insights_message_idx on public.crm_insights (message_id);
create unique index if not exists crm_insights_message_type_full_uq on public.crm_insights (message_id,insight_type);
create unique index if not exists crm_insights_message_type_uq on public.crm_insights (message_id,insight_type) where message_id is not null;
create index if not exists crm_insights_opportunity_idx on public.crm_insights (opportunity_id,created_at desc);

create index if not exists crm_messages_conversation_sent_idx on public.crm_messages (conversation_id,sent_at desc);
create index if not exists crm_processor_runs_status_idx on public.crm_processor_runs (status,started_at desc);
create index if not exists integration_events_status_idx on public.integration_events (processing_status,created_at);

create unique index if not exists sales_opportunities_active_conversation_uq
  on public.sales_opportunities (source_conversation_id)
  where source_conversation_id is not null and stage <> all (array['won'::text,'lost'::text,'dormant'::text]);
create index if not exists sales_opportunities_company_idx on public.sales_opportunities (company_id);
create index if not exists sales_opportunities_latest_proposal_idx on public.sales_opportunities (latest_proposal_id);
create unique index if not exists sales_opportunities_legacy_opportunity_id_uq on public.sales_opportunities (legacy_opportunity_id) where legacy_opportunity_id is not null and btrim(legacy_opportunity_id) <> '';
create index if not exists sales_opportunities_next_action_idx on public.sales_opportunities (next_action_due_at) where next_action_due_at is not null;
create index if not exists sales_opportunities_next_action_type_due_idx on public.sales_opportunities (next_action_type,next_action_due_at) where next_action_due_at is not null;
create index if not exists sales_opportunities_pipeline_stage_v2_idx on public.sales_opportunities (pipeline_stage);
create index if not exists sales_opportunities_primary_contact_idx on public.sales_opportunities (primary_contact_id);
create index if not exists sales_opportunities_source_conversation_idx on public.sales_opportunities (source_conversation_id);
create index if not exists sales_opportunities_stage_idx on public.sales_opportunities (stage);
create index if not exists sales_opportunities_vehicle_profile_idx on public.sales_opportunities (vehicle_profile_id);

alter table public.crm_contacts enable row level security;
alter table public.crm_conversations enable row level security;
alter table public.crm_messages enable row level security;
alter table public.sales_opportunities enable row level security;
alter table public.crm_insights enable row level security;
alter table public.crm_processor_runs enable row level security;
alter table public.crm_activities enable row level security;
alter table public.integration_events enable row level security;

grant all on table public.crm_contacts to anon, authenticated, service_role;
grant all on table public.crm_conversations to anon, authenticated, service_role;
grant all on table public.crm_messages to anon, authenticated, service_role;
grant all on table public.sales_opportunities to anon, authenticated, service_role;
grant all on table public.crm_insights to anon, authenticated, service_role;
grant all on table public.crm_processor_runs to anon, authenticated, service_role;
grant all on table public.crm_activities to anon, authenticated, service_role;
grant all on table public.integration_events to anon, authenticated, service_role;
