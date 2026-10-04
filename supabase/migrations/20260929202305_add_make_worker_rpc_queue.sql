
alter table public.enrichment_jobs
  add column if not exists locked_by text,
  add column if not exists locked_until timestamptz;

alter table public.render_jobs
  add column if not exists locked_by text,
  add column if not exists locked_until timestamptz;

create or replace function public.claim_enrichment_job_v1(
  p_worker text default 'make',
  p_lease_minutes integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_company public.companies%rowtype;
  v_proposal public.proposals%rowtype;
begin
  if p_lease_minutes < 1 or p_lease_minutes > 120 then
    raise exception 'lease minutes must be between 1 and 120';
  end if;

  select *
  into v_job
  from public.enrichment_jobs
  where status in ('pending','processing')
    and (next_attempt_at is null or next_attempt_at <= now())
    and (locked_until is null or locked_until <= now())
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('job', null);
  end if;

  update public.enrichment_jobs
  set
    status = 'processing',
    attempts = attempts + 1,
    locked_by = p_worker,
    locked_until = now() + make_interval(mins => p_lease_minutes),
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where id = v_job.id
  returning * into v_job;

  select * into v_company
  from public.companies
  where id = v_job.company_id;

  if v_job.proposal_id is not null then
    select * into v_proposal
    from public.proposals
    where id = v_job.proposal_id;
  end if;

  return jsonb_build_object(
    'job', jsonb_build_object(
      'id', v_job.id,
      'status', v_job.status,
      'attempts', v_job.attempts,
      'locked_by', v_job.locked_by,
      'locked_until', v_job.locked_until,
      'input', v_job.input
    ),
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'legal_name', v_company.legal_name,
      'cnpj', v_company.cnpj,
      'domain', v_company.domain,
      'website', v_company.website,
      'sector', v_company.sector,
      'subsector', v_company.subsector,
      'logo_url', v_company.logo_url
    ),
    'proposal', case when v_job.proposal_id is null then null else jsonb_build_object(
      'id', v_proposal.id,
      'company_name_input', v_proposal.company_name_input,
      'fleet_size', v_proposal.fleet_size,
      'status', v_proposal.status
    ) end
  );
end;
$$;

create or replace function public.claim_render_job_v1(
  p_worker text default 'make',
  p_lease_minutes integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.render_jobs%rowtype;
  v_proposal public.proposals%rowtype;
begin
  if p_lease_minutes < 1 or p_lease_minutes > 120 then
    raise exception 'lease minutes must be between 1 and 120';
  end if;

  select *
  into v_job
  from public.render_jobs
  where status in ('pending','processing')
    and (next_attempt_at is null or next_attempt_at <= now())
    and (locked_until is null or locked_until <= now())
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('job', null);
  end if;

  update public.render_jobs
  set
    status = 'processing',
    attempts = attempts + 1,
    locked_by = p_worker,
    locked_until = now() + make_interval(mins => p_lease_minutes),
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where id = v_job.id
  returning * into v_job;

  select * into v_proposal
  from public.proposals
  where id = v_job.proposal_id;

  update public.proposals
  set status = 'rendering',
      updated_at = now()
  where id = v_job.proposal_id;

  return jsonb_build_object(
    'job', jsonb_build_object(
      'id', v_job.id,
      'status', v_job.status,
      'renderer', v_job.renderer,
      'attempts', v_job.attempts,
      'locked_by', v_job.locked_by,
      'locked_until', v_job.locked_until,
      'input', v_job.input
    ),
    'proposal', jsonb_build_object(
      'id', v_proposal.id,
      'company_id', v_proposal.company_id,
      'company_name_input', v_proposal.company_name_input,
      'fleet_size', v_proposal.fleet_size,
      'status', 'rendering',
      'snapshot', v_proposal.proposal_snapshot
    )
  );
end;
$$;

create or replace function public.fail_enrichment_job_v1(
  p_job_id uuid,
  p_error text,
  p_retry_minutes integer default 15
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_retry_minutes < 0 or p_retry_minutes > 10080 then
    raise exception 'retry minutes must be between 0 and 10080';
  end if;

  update public.enrichment_jobs
  set
    status = case when attempts >= 3 then 'failed' else 'pending' end,
    error_message = left(coalesce(p_error, 'unknown error'), 4000),
    next_attempt_at = case when attempts >= 3 then null else now() + make_interval(mins => p_retry_minutes) end,
    locked_by = null,
    locked_until = null,
    updated_at = now()
  where id = p_job_id
  returning status into v_status;

  if v_status is null then
    raise exception 'enrichment job not found: %', p_job_id;
  end if;

  return jsonb_build_object('job_id', p_job_id, 'status', v_status);
end;
$$;

create or replace function public.fail_render_job_v1(
  p_job_id uuid,
  p_error text,
  p_retry_minutes integer default 15
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.render_jobs%rowtype;
  v_status text;
begin
  select * into v_job
  from public.render_jobs
  where id = p_job_id;

  if not found then
    raise exception 'render job not found: %', p_job_id;
  end if;

  update public.render_jobs
  set
    status = case when attempts >= 3 then 'failed' else 'pending' end,
    error_message = left(coalesce(p_error, 'unknown error'), 4000),
    next_attempt_at = case when attempts >= 3 then null else now() + make_interval(mins => p_retry_minutes) end,
    locked_by = null,
    locked_until = null,
    updated_at = now()
  where id = p_job_id
  returning status into v_status;

  if v_status = 'failed' then
    update public.proposals
    set status = 'failed',
        error_message = left(coalesce(p_error, 'render failed'), 4000),
        updated_at = now()
    where id = v_job.proposal_id;
  end if;

  return jsonb_build_object('job_id', p_job_id, 'status', v_status);
end;
$$;

revoke all on function public.claim_enrichment_job_v1(text, integer) from public, anon, authenticated;
revoke all on function public.claim_render_job_v1(text, integer) from public, anon, authenticated;
revoke all on function public.fail_enrichment_job_v1(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.fail_render_job_v1(uuid, text, integer) from public, anon, authenticated;

grant execute on function public.claim_enrichment_job_v1(text, integer) to service_role;
grant execute on function public.claim_render_job_v1(text, integer) to service_role;
grant execute on function public.fail_enrichment_job_v1(uuid, text, integer) to service_role;
grant execute on function public.fail_render_job_v1(uuid, text, integer) to service_role;
