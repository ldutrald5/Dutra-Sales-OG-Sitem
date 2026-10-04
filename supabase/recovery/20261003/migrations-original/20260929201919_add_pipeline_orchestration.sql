
alter table public.render_jobs
  drop constraint if exists render_jobs_status_check;

alter table public.render_jobs
  add constraint render_jobs_status_check
  check (status in ('waiting','pending','processing','completed','failed','cancelled'));

alter table public.proposals
  add column if not exists pdf_storage_path text;

create or replace function public.enqueue_proposal_pipeline()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_enrichment_status text;
begin
  select enrichment_status
    into v_enrichment_status
  from public.companies
  where id = new.company_id;

  if coalesce(v_enrichment_status, 'pending') = 'enriched' then
    insert into public.render_jobs (
      proposal_id, status, renderer, input
    )
    values (
      new.id,
      'pending',
      'html_pdf',
      jsonb_build_object('proposal_id', new.id, 'reason', 'company_already_enriched')
    );

    update public.proposals
    set status = 'rendering',
        updated_at = now()
    where id = new.id;
  else
    insert into public.enrichment_jobs (
      company_id, proposal_id, status, input
    )
    values (
      new.company_id,
      new.id,
      'pending',
      jsonb_build_object(
        'company_name', new.company_name_input,
        'proposal_id', new.id
      )
    );

    insert into public.render_jobs (
      proposal_id, status, renderer, input
    )
    values (
      new.id,
      'waiting',
      'html_pdf',
      jsonb_build_object('proposal_id', new.id, 'waiting_for', 'company_enrichment')
    );

    update public.proposals
    set status = 'enriching',
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists proposals_enqueue_pipeline on public.proposals;

create trigger proposals_enqueue_pipeline
after insert on public.proposals
for each row
execute function public.enqueue_proposal_pipeline();

create or replace function public.complete_company_enrichment_v1(
  p_job_id uuid,
  p_domain text default null,
  p_website text default null,
  p_sector text default null,
  p_subsector text default null,
  p_logo_url text default null,
  p_confidence numeric default null,
  p_raw jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_reference_count integer := 0;
begin
  select *
  into v_job
  from public.enrichment_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'enrichment job not found: %', p_job_id;
  end if;

  if p_confidence is not null and (p_confidence < 0 or p_confidence > 1) then
    raise exception 'confidence must be between 0 and 1';
  end if;

  update public.companies
  set
    domain = coalesce(nullif(trim(p_domain), ''), domain),
    website = coalesce(nullif(trim(p_website), ''), website),
    sector = coalesce(nullif(trim(p_sector), ''), sector),
    subsector = coalesce(nullif(trim(p_subsector), ''), subsector),
    logo_url = coalesce(nullif(trim(p_logo_url), ''), logo_url),
    enrichment_status =
      case
        when coalesce(nullif(trim(p_sector), ''), sector) is not null
         and coalesce(nullif(trim(p_logo_url), ''), logo_url) is not null
        then 'enriched'
        else 'partial'
      end,
    enrichment_confidence = coalesce(p_confidence, enrichment_confidence),
    enrichment_data = coalesce(enrichment_data, '{}'::jsonb) || coalesce(p_raw, '{}'::jsonb),
    updated_at = now()
  where id = v_job.company_id;

  update public.enrichment_jobs
  set
    status =
      case
        when p_sector is not null and p_logo_url is not null then 'completed'
        else 'needs_review'
      end,
    output = coalesce(p_raw, '{}'::jsonb) || jsonb_build_object(
      'domain', p_domain,
      'website', p_website,
      'sector', p_sector,
      'subsector', p_subsector,
      'logo_url', p_logo_url,
      'confidence', p_confidence
    ),
    completed_at = now(),
    updated_at = now()
  where id = p_job_id;

  if v_job.proposal_id is not null then
    delete from public.proposal_references
    where proposal_id = v_job.proposal_id;

    with selected as (
      select id,
             row_number() over (order by priority desc, company_name asc) as pos
      from public.reference_clients
      where active = true
        and approved_for_marketing = true
        and p_sector is not null
        and sector = p_sector
      order by priority desc, company_name asc
      limit 6
    )
    insert into public.proposal_references (
      proposal_id, reference_client_id, position
    )
    select v_job.proposal_id, id, pos
    from selected
    on conflict do nothing;

    get diagnostics v_reference_count = row_count;

    update public.render_jobs
    set
      status = 'pending',
      input = input || jsonb_build_object(
        'enrichment_job_id', p_job_id,
        'sector', p_sector,
        'reference_count', v_reference_count
      ),
      updated_at = now()
    where proposal_id = v_job.proposal_id
      and status = 'waiting';

    update public.proposals
    set
      status = 'rendering',
      proposal_snapshot =
        proposal_snapshot ||
        jsonb_build_object(
          'company_enrichment',
          jsonb_build_object(
            'domain', p_domain,
            'website', p_website,
            'sector', p_sector,
            'subsector', p_subsector,
            'logo_url', p_logo_url,
            'confidence', p_confidence
          ),
          'reference_count', v_reference_count
        ),
      updated_at = now()
    where id = v_job.proposal_id;
  end if;

  return jsonb_build_object(
    'job_id', p_job_id,
    'company_id', v_job.company_id,
    'proposal_id', v_job.proposal_id,
    'reference_count', v_reference_count,
    'render_released', v_job.proposal_id is not null
  );
end;
$$;

revoke all on function public.complete_company_enrichment_v1(
  uuid, text, text, text, text, text, numeric, jsonb
) from public, anon, authenticated;

grant execute on function public.complete_company_enrichment_v1(
  uuid, text, text, text, text, text, numeric, jsonb
) to service_role;

create or replace function public.complete_render_v1(
  p_render_job_id uuid,
  p_storage_path text,
  p_mime_type text default 'application/pdf',
  p_size_bytes bigint default null,
  p_sha256 text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.render_jobs%rowtype;
  v_artifact_id uuid;
begin
  select *
  into v_job
  from public.render_jobs
  where id = p_render_job_id
  for update;

  if not found then
    raise exception 'render job not found: %', p_render_job_id;
  end if;

  insert into public.proposal_artifacts (
    proposal_id,
    artifact_type,
    storage_bucket,
    storage_path,
    mime_type,
    size_bytes,
    sha256,
    metadata
  )
  values (
    v_job.proposal_id,
    'pdf',
    'proposal-artifacts',
    p_storage_path,
    p_mime_type,
    p_size_bytes,
    p_sha256,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_artifact_id;

  update public.render_jobs
  set
    status = 'completed',
    output = coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'artifact_id', v_artifact_id,
      'storage_path', p_storage_path
    ),
    completed_at = now(),
    updated_at = now()
  where id = p_render_job_id;

  update public.proposals
  set
    status = 'ready',
    pdf_storage_path = p_storage_path,
    updated_at = now()
  where id = v_job.proposal_id;

  return jsonb_build_object(
    'proposal_id', v_job.proposal_id,
    'artifact_id', v_artifact_id,
    'storage_path', p_storage_path,
    'status', 'ready'
  );
end;
$$;

revoke all on function public.complete_render_v1(
  uuid, text, text, bigint, text, jsonb
) from public, anon, authenticated;

grant execute on function public.complete_render_v1(
  uuid, text, text, bigint, text, jsonb
) to service_role;
