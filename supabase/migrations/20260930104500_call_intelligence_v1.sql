-- Call Intelligence V1: durable audio metadata, transcripts and measurable conversation signals.
-- Audio objects remain private in Storage. No automatic deletion is introduced.

create table if not exists public.call_recordings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  contact_id uuid references public.crm_contacts(id),
  opportunity_id uuid references public.sales_opportunities(id),
  call_attempt_id uuid references public.call_attempts(id),
  prospecting_session_id uuid references public.prospecting_sessions(id),
  lead_list_member_id uuid references public.lead_list_members(id),
  call_session_id text not null,
  storage_bucket text not null default 'call-recordings',
  storage_path text not null,
  capture_mode text not null check (capture_mode in ('MICROPHONE','COMPUTER_MIX')),
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  seller_active_ms integer check (seller_active_ms is null or seller_active_ms >= 0),
  customer_active_ms integer check (customer_active_ms is null or customer_active_ms >= 0),
  overlap_ms integer check (overlap_ms is null or overlap_ms >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  recording_status text not null default 'PENDING_UPLOAD'
    check (recording_status in ('PENDING_UPLOAD','UPLOADED','PROCESSING','READY','FAILED','DELETED')),
  transcription_status text not null default 'NOT_REQUESTED'
    check (transcription_status in ('NOT_REQUESTED','QUEUED','PROCESSING','READY','UNAVAILABLE','FAILED')),
  transcription_provider text,
  transcription_model text,
  transcription_error text,
  user_initiated boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists call_recordings_call_session_uq
  on public.call_recordings(call_session_id)
  where btrim(call_session_id) <> '';

create unique index if not exists call_recordings_storage_path_uq
  on public.call_recordings(storage_path);

create index if not exists call_recordings_company_created_idx
  on public.call_recordings(company_id, created_at desc);

create index if not exists call_recordings_status_idx
  on public.call_recordings(recording_status, transcription_status, updated_at desc);

create table if not exists public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null unique references public.call_recordings(id) on delete cascade,
  provider text not null,
  model text not null,
  language text not null default 'pt',
  transcript_text text not null,
  segments jsonb not null default '[]'::jsonb,
  provider_usage jsonb not null default '{}'::jsonb,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_transcripts_created_idx
  on public.call_transcripts(created_at desc);

create table if not exists public.call_conversation_metrics (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null unique references public.call_recordings(id) on delete cascade,
  transcript_id uuid references public.call_transcripts(id) on delete set null,
  analysis_version text not null default 'call-intelligence-v1',
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  word_count integer not null default 0 check (word_count >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  seller_talk_ms integer check (seller_talk_ms is null or seller_talk_ms >= 0),
  customer_talk_ms integer check (customer_talk_ms is null or customer_talk_ms >= 0),
  overlap_ms integer check (overlap_ms is null or overlap_ms >= 0),
  seller_talk_ratio numeric check (seller_talk_ratio is null or (seller_talk_ratio >= 0 and seller_talk_ratio <= 1)),
  customer_talk_ratio numeric check (customer_talk_ratio is null or (customer_talk_ratio >= 0 and customer_talk_ratio <= 1)),
  objection_count integer not null default 0 check (objection_count >= 0),
  objections jsonb not null default '[]'::jsonb,
  keyword_counts jsonb not null default '{}'::jsonb,
  numeric_mentions jsonb not null default '[]'::jsonb,
  extracted_candidates jsonb not null default '[]'::jsonb,
  speaker_map jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_conversation_metrics_created_idx
  on public.call_conversation_metrics(created_at desc);

alter table public.call_recordings enable row level security;
alter table public.call_transcripts enable row level security;
alter table public.call_conversation_metrics enable row level security;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'call-recordings',
  'call-recordings',
  false,
  104857600,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-wav']::text[]
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types,
  updated_at=now();

comment on table public.call_recordings is
  'Private call audio metadata. Objects live in the private call-recordings Storage bucket.';
comment on table public.call_transcripts is
  'Transcription generated from a call_recording. Transcript output is guidance and remains reviewable.';
comment on table public.call_conversation_metrics is
  'Deterministic and capture-derived call metrics; extracted candidates are not canonical CRM facts until reviewed.';
