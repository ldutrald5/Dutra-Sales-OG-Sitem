
create table if not exists public.pipeline_events (
  id bigserial primary key,
  proposal_id uuid references public.proposals(id) on delete cascade,
  entity_type text not null
    check (entity_type in ('proposal','enrichment_job','render_job')),
  entity_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pipeline_events_proposal_idx
  on public.pipeline_events (proposal_id, created_at desc);

create index if not exists pipeline_events_entity_idx
  on public.pipeline_events (entity_type, entity_id, created_at desc);

alter table public.pipeline_events enable row level security;
revoke all on table public.pipeline_events from anon, authenticated;
grant select, insert on table public.pipeline_events to service_role;

create or replace function public.log_proposal_status_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.pipeline_events (
      proposal_id, entity_type, entity_id, event_type, from_status, to_status, payload
    )
    values (
      new.id,
      'proposal',
      new.id,
      'status_changed',
      old.status,
      new.status,
      jsonb_build_object(
        'error_message', new.error_message,
        'pdf_storage_path', new.pdf_storage_path
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_status_audit on public.proposals;
create trigger proposals_status_audit
after update of status on public.proposals
for each row
execute function public.log_proposal_status_event();

create or replace function public.log_enrichment_job_status_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.pipeline_events (
      proposal_id, entity_type, entity_id, event_type, from_status, to_status, payload
    )
    values (
      new.proposal_id,
      'enrichment_job',
      new.id,
      'status_changed',
      old.status,
      new.status,
      jsonb_build_object(
        'attempts', new.attempts,
        'provider', new.provider,
        'error_message', new.error_message,
        'locked_by', new.locked_by
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists enrichment_jobs_status_audit on public.enrichment_jobs;
create trigger enrichment_jobs_status_audit
after update of status on public.enrichment_jobs
for each row
execute function public.log_enrichment_job_status_event();

create or replace function public.log_render_job_status_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.pipeline_events (
      proposal_id, entity_type, entity_id, event_type, from_status, to_status, payload
    )
    values (
      new.proposal_id,
      'render_job',
      new.id,
      'status_changed',
      old.status,
      new.status,
      jsonb_build_object(
        'attempts', new.attempts,
        'renderer', new.renderer,
        'error_message', new.error_message,
        'locked_by', new.locked_by
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists render_jobs_status_audit on public.render_jobs;
create trigger render_jobs_status_audit
after update of status on public.render_jobs
for each row
execute function public.log_render_job_status_event();

create or replace function public.pipeline_status_v1(
  p_proposal_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'proposal', jsonb_build_object(
      'id', p.id,
      'company_name', p.company_name_input,
      'fleet_size', p.fleet_size,
      'status', p.status,
      'pdf_storage_path', p.pdf_storage_path,
      'error_message', p.error_message,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ),
    'company', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'domain', c.domain,
      'sector', c.sector,
      'logo_url', c.logo_url,
      'enrichment_status', c.enrichment_status,
      'enrichment_confidence', c.enrichment_confidence
    ),
    'enrichment_jobs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ej.id,
        'status', ej.status,
        'attempts', ej.attempts,
        'provider', ej.provider,
        'error_message', ej.error_message,
        'locked_by', ej.locked_by,
        'locked_until', ej.locked_until,
        'created_at', ej.created_at,
        'completed_at', ej.completed_at
      ) order by ej.created_at desc)
      from public.enrichment_jobs ej
      where ej.proposal_id = p.id
    ), '[]'::jsonb),
    'render_jobs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rj.id,
        'status', rj.status,
        'attempts', rj.attempts,
        'renderer', rj.renderer,
        'error_message', rj.error_message,
        'locked_by', rj.locked_by,
        'locked_until', rj.locked_until,
        'created_at', rj.created_at,
        'completed_at', rj.completed_at
      ) order by rj.created_at desc)
      from public.render_jobs rj
      where rj.proposal_id = p.id
    ), '[]'::jsonb),
    'artifacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pa.id,
        'type', pa.artifact_type,
        'bucket', pa.storage_bucket,
        'path', pa.storage_path,
        'mime_type', pa.mime_type,
        'size_bytes', pa.size_bytes,
        'created_at', pa.created_at
      ) order by pa.created_at desc)
      from public.proposal_artifacts pa
      where pa.proposal_id = p.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_type', pe.event_type,
        'entity_type', pe.entity_type,
        'entity_id', pe.entity_id,
        'from_status', pe.from_status,
        'to_status', pe.to_status,
        'payload', pe.payload,
        'created_at', pe.created_at
      ) order by pe.created_at desc)
      from (
        select *
        from public.pipeline_events
        where proposal_id = p.id
        order by created_at desc
        limit 50
      ) pe
    ), '[]'::jsonb)
  )
  from public.proposals p
  left join public.companies c on c.id = p.company_id
  where p.id = p_proposal_id;
$$;

revoke all on function public.pipeline_status_v1(uuid) from public, anon, authenticated;
grant execute on function public.pipeline_status_v1(uuid) to service_role;
