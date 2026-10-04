
create or replace function public.apply_company_discovery_v2(
  p_job_id uuid,
  p_canonical_name text default null,
  p_domain text default null,
  p_website text default null,
  p_sector_raw text default null,
  p_subsectors text[] default null,
  p_description text default null,
  p_logo_source_url text default null,
  p_logo_confidence numeric default null,
  p_branding jsonb default '{}'::jsonb,
  p_sources jsonb default '[]'::jsonb,
  p_provider text default 'firecrawl'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_sector jsonb;
  v_sector_code text;
  v_sector_score numeric;
  v_score numeric := 0;
  v_status text;
  v_source_count integer := 0;
  v_reference_count integer := 0;
  v_source jsonb;
  v_is_official boolean := false;
  v_logo_conf numeric;
begin
  select *
  into v_job
  from public.enrichment_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'enrichment job not found: %', p_job_id;
  end if;

  if p_logo_confidence is not null and (p_logo_confidence < 0 or p_logo_confidence > 1) then
    raise exception 'logo confidence must be between 0 and 1';
  end if;

  if jsonb_typeof(coalesce(p_sources, '[]'::jsonb)) <> 'array' then
    raise exception 'sources must be a JSON array';
  end if;

  v_sector := public.normalize_sector_v1(p_sector_raw, p_subsectors);
  v_sector_code := v_sector->>'code';
  v_sector_score := coalesce((v_sector->>'score')::numeric, 0);

  if nullif(trim(p_domain), '') is not null and nullif(trim(p_website), '') is not null then
    v_score := v_score + 0.20;
  elsif nullif(trim(p_domain), '') is not null or nullif(trim(p_website), '') is not null then
    v_score := v_score + 0.10;
  end if;

  if nullif(trim(p_canonical_name), '') is not null then
    v_score := v_score + 0.10;
  end if;

  if v_sector_code <> 'other' then
    v_score := v_score + (0.25 * greatest(0, least(1, v_sector_score)));
  end if;

  v_logo_conf := coalesce(p_logo_confidence, case when p_logo_source_url is not null then 0.7 else 0 end);
  if nullif(trim(p_logo_source_url), '') is not null then
    v_score := v_score + (0.15 * greatest(0, least(1, v_logo_conf)));
  end if;

  if nullif(trim(p_description), '') is not null then
    v_score := v_score + 0.10;
  end if;

  for v_source in
    select value from jsonb_array_elements(coalesce(p_sources, '[]'::jsonb))
  loop
    v_source_count := v_source_count + 1;
    v_is_official := v_is_official or coalesce((v_source->>'is_official')::boolean, false);

    insert into public.company_discovery_sources (
      company_id,
      enrichment_job_id,
      source_type,
      provider,
      source_url,
      is_official,
      confidence,
      extracted
    )
    values (
      v_job.company_id,
      p_job_id,
      coalesce(nullif(v_source->>'source_type',''), 'other'),
      coalesce(nullif(v_source->>'provider',''), p_provider),
      nullif(v_source->>'source_url',''),
      coalesce((v_source->>'is_official')::boolean, false),
      case
        when nullif(v_source->>'confidence','') is null then null
        else greatest(0, least(1, (v_source->>'confidence')::numeric))
      end,
      coalesce(v_source->'extracted', '{}'::jsonb)
    );
  end loop;

  if v_source_count > 0 then
    v_score := v_score + least(0.10, v_source_count * 0.025);
  end if;

  if v_is_official then
    v_score := v_score + 0.10;
  end if;

  v_score := greatest(0, least(1, v_score));

  if v_score >= 0.80 and v_sector_code <> 'other' and v_is_official then
    v_status := 'enriched';
  elsif v_score >= 0.55 then
    v_status := 'partial';
  else
    v_status := 'needs_review';
  end if;

  update public.companies
  set
    name = coalesce(nullif(trim(p_canonical_name), ''), name),
    domain = coalesce(nullif(trim(p_domain), ''), domain),
    website = coalesce(nullif(trim(p_website), ''), website),
    sector = case when v_sector_code <> 'other' then v_sector_code else sector end,
    subsector = coalesce(nullif(array_to_string(p_subsectors, ' / '), ''), subsector),
    logo_url = coalesce(nullif(trim(p_logo_source_url), ''), logo_url),
    enrichment_status = v_status,
    enrichment_confidence = v_score,
    enrichment_data =
      coalesce(enrichment_data, '{}'::jsonb) ||
      jsonb_build_object(
        'provider', p_provider,
        'canonical_name', p_canonical_name,
        'description', p_description,
        'sector_raw', p_sector_raw,
        'sector_normalized', v_sector,
        'subsectors', coalesce(to_jsonb(p_subsectors), '[]'::jsonb),
        'branding', coalesce(p_branding, '{}'::jsonb),
        'source_count', v_source_count
      ),
    updated_at = now()
  where id = v_job.company_id;

  if nullif(trim(p_logo_source_url), '') is not null then
    update public.company_brand_assets
    set is_primary = false, updated_at = now()
    where company_id = v_job.company_id
      and asset_type = 'logo'
      and is_primary = true;

    insert into public.company_brand_assets (
      company_id,
      asset_type,
      source_url,
      confidence,
      status,
      is_primary,
      metadata
    )
    values (
      v_job.company_id,
      'logo',
      p_logo_source_url,
      v_logo_conf,
      'pending_copy',
      true,
      jsonb_build_object(
        'provider', p_provider,
        'discovered_from_job', p_job_id
      )
    );
  end if;

  if coalesce(p_branding, '{}'::jsonb) <> '{}'::jsonb then
    insert into public.company_brand_assets (
      company_id,
      asset_type,
      confidence,
      status,
      is_primary,
      metadata
    )
    values (
      v_job.company_id,
      'brand_palette',
      coalesce((p_branding#>>'{confidence,overall}')::numeric, v_score),
      'stored',
      true,
      p_branding
    );
  end if;

  update public.enrichment_jobs
  set
    provider = p_provider,
    status = case when v_status = 'enriched' then 'completed' else 'needs_review' end,
    output = jsonb_build_object(
      'canonical_name', p_canonical_name,
      'domain', p_domain,
      'website', p_website,
      'sector', v_sector_code,
      'sector_details', v_sector,
      'subsectors', coalesce(to_jsonb(p_subsectors), '[]'::jsonb),
      'description', p_description,
      'logo_source_url', p_logo_source_url,
      'branding', coalesce(p_branding, '{}'::jsonb),
      'confidence', v_score,
      'enrichment_status', v_status,
      'source_count', v_source_count
    ),
    error_message = null,
    locked_by = null,
    locked_until = null,
    completed_at = case when v_status = 'enriched' then now() else completed_at end,
    updated_at = now()
  where id = p_job_id;

  if v_job.proposal_id is not null then
    delete from public.proposal_references
    where proposal_id = v_job.proposal_id;

    if v_sector_code <> 'other' then
      with selected as (
        select id,
               row_number() over (order by priority desc, company_name asc) as pos
        from public.reference_clients
        where active = true
          and approved_for_marketing = true
          and sector = v_sector_code
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
    end if;

    update public.proposals
    set
      proposal_snapshot =
        proposal_snapshot ||
        jsonb_build_object(
          'company_enrichment',
          jsonb_build_object(
            'canonical_name', p_canonical_name,
            'domain', p_domain,
            'website', p_website,
            'sector', v_sector_code,
            'sector_details', v_sector,
            'subsectors', coalesce(to_jsonb(p_subsectors), '[]'::jsonb),
            'description', p_description,
            'logo_url', p_logo_source_url,
            'branding', coalesce(p_branding, '{}'::jsonb),
            'confidence', v_score,
            'status', v_status
          ),
          'reference_count',
          v_reference_count
        ),
      updated_at = now()
    where id = v_job.proposal_id;

    if v_status = 'enriched' then
      update public.render_jobs
      set
        status = 'pending',
        input = input || jsonb_build_object(
          'enrichment_job_id', p_job_id,
          'sector', v_sector_code,
          'reference_count', v_reference_count,
          'company_confidence', v_score
        ),
        updated_at = now()
      where proposal_id = v_job.proposal_id
        and status = 'waiting';

      update public.proposals
      set status = 'rendering', updated_at = now()
      where id = v_job.proposal_id;
    else
      update public.proposals
      set status = 'enriching', updated_at = now()
      where id = v_job.proposal_id;
    end if;
  end if;

  return jsonb_build_object(
    'job_id', p_job_id,
    'company_id', v_job.company_id,
    'proposal_id', v_job.proposal_id,
    'sector', v_sector_code,
    'sector_details', v_sector,
    'confidence', v_score,
    'enrichment_status', v_status,
    'source_count', v_source_count,
    'reference_count', v_reference_count,
    'render_released', v_status = 'enriched' and v_job.proposal_id is not null
  );
end;
$$;

revoke all on function public.apply_company_discovery_v2(
  uuid, text, text, text, text, text[], text, text, numeric, jsonb, jsonb, text
) from public, anon, authenticated;

grant execute on function public.apply_company_discovery_v2(
  uuid, text, text, text, text, text[], text, text, numeric, jsonb, jsonb, text
) to service_role;
