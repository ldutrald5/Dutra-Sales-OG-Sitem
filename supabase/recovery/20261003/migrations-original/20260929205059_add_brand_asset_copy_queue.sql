
alter table public.company_brand_assets
  add column if not exists attempts integer not null default 0 check (attempts >= 0),
  add column if not exists error_message text,
  add column if not exists locked_by text,
  add column if not exists locked_until timestamptz;

create or replace function public.claim_brand_asset_v1(
  p_worker text default 'asset-copy',
  p_lease_minutes integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asset public.company_brand_assets%rowtype;
  v_company public.companies%rowtype;
begin
  if p_lease_minutes < 1 or p_lease_minutes > 120 then
    raise exception 'lease minutes must be between 1 and 120';
  end if;

  select *
  into v_asset
  from public.company_brand_assets
  where asset_type in ('logo','favicon','hero','photo')
    and status = 'pending_copy'
    and source_url is not null
    and (locked_until is null or locked_until <= now())
  order by is_primary desc, created_at asc
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('asset', null);
  end if;

  update public.company_brand_assets
  set
    attempts = attempts + 1,
    locked_by = p_worker,
    locked_until = now() + make_interval(mins => p_lease_minutes),
    updated_at = now()
  where id = v_asset.id
  returning * into v_asset;

  select * into v_company
  from public.companies
  where id = v_asset.company_id;

  return jsonb_build_object(
    'asset', jsonb_build_object(
      'id', v_asset.id,
      'company_id', v_asset.company_id,
      'type', v_asset.asset_type,
      'source_url', v_asset.source_url,
      'attempts', v_asset.attempts,
      'locked_by', v_asset.locked_by,
      'locked_until', v_asset.locked_until
    ),
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'domain', v_company.domain,
      'sector', v_company.sector
    )
  );
end;
$$;

create or replace function public.complete_brand_asset_v1(
  p_asset_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asset public.company_brand_assets%rowtype;
begin
  select * into v_asset
  from public.company_brand_assets
  where id = p_asset_id
  for update;

  if not found then
    raise exception 'brand asset not found: %', p_asset_id;
  end if;

  update public.company_brand_assets
  set
    storage_bucket = 'company-assets',
    storage_path = p_storage_path,
    mime_type = p_mime_type,
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb) ||
      jsonb_build_object('size_bytes', p_size_bytes),
    status = 'stored',
    error_message = null,
    locked_by = null,
    locked_until = null,
    updated_at = now()
  where id = p_asset_id;

  return jsonb_build_object(
    'asset_id', p_asset_id,
    'company_id', v_asset.company_id,
    'storage_bucket', 'company-assets',
    'storage_path', p_storage_path,
    'status', 'stored'
  );
end;
$$;

create or replace function public.fail_brand_asset_v1(
  p_asset_id uuid,
  p_error text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  update public.company_brand_assets
  set
    status = case when attempts >= 3 then 'failed' else 'pending_copy' end,
    error_message = left(coalesce(p_error, 'unknown error'), 4000),
    locked_by = null,
    locked_until = null,
    updated_at = now()
  where id = p_asset_id
  returning status into v_status;

  if v_status is null then
    raise exception 'brand asset not found: %', p_asset_id;
  end if;

  return jsonb_build_object(
    'asset_id', p_asset_id,
    'status', v_status
  );
end;
$$;

revoke all on function public.claim_brand_asset_v1(text, integer) from public, anon, authenticated;
revoke all on function public.complete_brand_asset_v1(uuid, text, text, bigint, jsonb) from public, anon, authenticated;
revoke all on function public.fail_brand_asset_v1(uuid, text) from public, anon, authenticated;

grant execute on function public.claim_brand_asset_v1(text, integer) to service_role;
grant execute on function public.complete_brand_asset_v1(uuid, text, text, bigint, jsonb) to service_role;
grant execute on function public.fail_brand_asset_v1(uuid, text) to service_role;
