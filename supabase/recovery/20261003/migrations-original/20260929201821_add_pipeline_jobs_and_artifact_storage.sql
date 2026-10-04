
create table if not exists public.enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','processing','completed','needs_review','failed','cancelled')),
  provider text,
  attempts integer not null default 0 check (attempts >= 0),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  next_attempt_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrichment_jobs_status_idx
  on public.enrichment_jobs (status, next_attempt_at, created_at);

create index if not exists enrichment_jobs_company_idx
  on public.enrichment_jobs (company_id, created_at desc);

create index if not exists enrichment_jobs_proposal_idx
  on public.enrichment_jobs (proposal_id)
  where proposal_id is not null;

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','processing','completed','failed','cancelled')),
  renderer text not null default 'html_pdf',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists render_jobs_status_idx
  on public.render_jobs (status, next_attempt_at, created_at);

create index if not exists render_jobs_proposal_idx
  on public.render_jobs (proposal_id, created_at desc);

create table if not exists public.proposal_artifacts (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  artifact_type text not null
    check (artifact_type in ('html','pdf','cover_image','preview_image','json')),
  storage_bucket text not null default 'proposal-artifacts',
  storage_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (proposal_id, artifact_type, storage_path)
);

create index if not exists proposal_artifacts_proposal_idx
  on public.proposal_artifacts (proposal_id, artifact_type, created_at desc);

alter table public.enrichment_jobs enable row level security;
alter table public.render_jobs enable row level security;
alter table public.proposal_artifacts enable row level security;

revoke all on table public.enrichment_jobs from anon, authenticated;
revoke all on table public.render_jobs from anon, authenticated;
revoke all on table public.proposal_artifacts from anon, authenticated;

grant select, insert, update, delete on table public.enrichment_jobs to service_role;
grant select, insert, update, delete on table public.render_jobs to service_role;
grant select, insert, update, delete on table public.proposal_artifacts to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proposal-artifacts',
  'proposal-artifacts',
  false,
  52428800,
  array['application/pdf','text/html','application/json','image/png','image/jpeg','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
