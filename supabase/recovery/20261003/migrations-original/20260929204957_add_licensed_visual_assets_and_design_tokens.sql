
create table if not exists public.visual_asset_library (
  id uuid primary key default gen_random_uuid(),
  sector text references public.sector_taxonomy(code) on delete restrict,
  asset_role text not null
    check (asset_role in ('cover','technical','investment','roi','social_proof','esg')),
  title text,
  source_url text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  tags text[] not null default '{}'::text[],
  license_type text,
  license_reference text,
  approved_for_commercial_use boolean not null default false,
  priority integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visual_asset_library_lookup_idx
  on public.visual_asset_library (
    sector, asset_role, approved_for_commercial_use, active, priority desc
  );

alter table public.visual_asset_library enable row level security;
revoke all on table public.visual_asset_library from anon, authenticated;
grant select, insert, update, delete on table public.visual_asset_library to service_role;

insert into public.sector_assets (sector, visual_theme, active)
values
  ('agro', jsonb_build_object(
    'primary','#2F6B3B','secondary','#A8C653','accent','#E2B93B',
    'background','#F5F7F1','text','#17251A'
  ), true),
  ('transport', jsonb_build_object(
    'primary','#173B57','secondary','#315F7D','accent','#E7A93B',
    'background','#F4F6F8','text','#14212A'
  ), true),
  ('logistics', jsonb_build_object(
    'primary','#24465D','secondary','#4C7187','accent','#E7A93B',
    'background','#F4F6F7','text','#172229'
  ), true),
  ('construction', jsonb_build_object(
    'primary','#3B3B3B','secondary','#6D6D6D','accent','#D68A2A',
    'background','#F5F3EF','text','#202020'
  ), true),
  ('mining', jsonb_build_object(
    'primary','#383F45','secondary','#626B72','accent','#D4A72C',
    'background','#F3F3F1','text','#202326'
  ), true),
  ('distribution', jsonb_build_object(
    'primary','#334E68','secondary','#627D98','accent','#D99A35',
    'background','#F5F7F9','text','#1D2730'
  ), true),
  ('food', jsonb_build_object(
    'primary','#6B3A2A','secondary','#9A5B43','accent','#D9A441',
    'background','#F9F5F1','text','#2D1F1A'
  ), true),
  ('industrial', jsonb_build_object(
    'primary','#37474F','secondary','#607D8B','accent','#D6A03A',
    'background','#F4F6F6','text','#1E272B'
  ), true),
  ('forestry', jsonb_build_object(
    'primary','#315A3A','secondary','#627B54','accent','#C29A45',
    'background','#F4F6F1','text','#1E2B20'
  ), true),
  ('waste', jsonb_build_object(
    'primary','#2E5E4E','secondary','#5C8475','accent','#D0A43C',
    'background','#F2F7F4','text','#1B2924'
  ), true),
  ('other', jsonb_build_object(
    'primary','#252525','secondary','#5D5D5D','accent','#B9974A',
    'background','#F5F5F5','text','#181818'
  ), true)
on conflict (sector) do update set
  visual_theme = excluded.visual_theme,
  active = true,
  updated_at = now();

create or replace function public.resolve_design_tokens_v1(
  p_company_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company public.companies%rowtype;
  v_brand jsonb;
  v_theme jsonb;
  v_colors jsonb;
  v_primary text;
  v_secondary text;
  v_accent text;
  v_background text;
  v_text text;
  v_source text;
begin
  select * into v_company
  from public.companies
  where id = p_company_id;

  if not found then
    raise exception 'company not found: %', p_company_id;
  end if;

  select metadata
  into v_brand
  from public.company_brand_assets
  where company_id = p_company_id
    and asset_type = 'brand_palette'
    and is_primary = true
    and status = 'stored'
  order by confidence desc nulls last, created_at desc
  limit 1;

  select visual_theme
  into v_theme
  from public.sector_assets
  where sector = coalesce(v_company.sector, 'other')
    and active = true
  limit 1;

  if v_theme is null then
    select visual_theme into v_theme
    from public.sector_assets
    where sector = 'other'
    limit 1;
  end if;

  v_colors := coalesce(v_brand->'colors', '{}'::jsonb);

  v_primary := coalesce(v_colors->>'primary', v_theme->>'primary', '#252525');
  v_secondary := coalesce(v_colors->>'secondary', v_theme->>'secondary', '#5D5D5D');
  v_accent := coalesce(v_colors->>'accent', v_theme->>'accent', '#B9974A');
  v_background := coalesce(v_colors->>'background', v_theme->>'background', '#F5F5F5');
  v_text := coalesce(v_colors->>'textPrimary', v_colors->>'text', v_theme->>'text', '#181818');

  if v_primary !~ '^#[0-9A-Fa-f]{6}$' then v_primary := v_theme->>'primary'; end if;
  if v_secondary !~ '^#[0-9A-Fa-f]{6}$' then v_secondary := v_theme->>'secondary'; end if;
  if v_accent !~ '^#[0-9A-Fa-f]{6}$' then v_accent := v_theme->>'accent'; end if;
  if v_background !~ '^#[0-9A-Fa-f]{6}$' then v_background := v_theme->>'background'; end if;
  if v_text !~ '^#[0-9A-Fa-f]{6}$' then v_text := v_theme->>'text'; end if;

  v_source := case when v_brand is not null then 'company_brand' else 'sector_fallback' end;

  return jsonb_build_object(
    'primary', coalesce(v_primary, '#252525'),
    'secondary', coalesce(v_secondary, '#5D5D5D'),
    'accent', coalesce(v_accent, '#B9974A'),
    'background', coalesce(v_background, '#F5F5F5'),
    'text', coalesce(v_text, '#181818'),
    'source', v_source,
    'sector', coalesce(v_company.sector, 'other')
  );
end;
$$;

create or replace function public.select_visual_assets_v1(
  p_sector text,
  p_limit_per_role integer default 1
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  with ranked as (
    select
      id,
      sector,
      asset_role,
      title,
      storage_bucket,
      storage_path,
      source_url,
      mime_type,
      tags,
      license_type,
      license_reference,
      priority,
      row_number() over (
        partition by asset_role
        order by priority desc, created_at asc
      ) as rn
    from public.visual_asset_library
    where sector = p_sector
      and approved_for_commercial_use = true
      and active = true
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'role', asset_role,
        'title', title,
        'bucket', storage_bucket,
        'path', storage_path,
        'source_url', source_url,
        'mime_type', mime_type,
        'tags', tags,
        'license_type', license_type,
        'license_reference', license_reference
      )
      order by asset_role, priority desc
    ),
    '[]'::jsonb
  )
  from ranked
  where rn <= greatest(1, least(p_limit_per_role, 5));
$$;

revoke all on function public.resolve_design_tokens_v1(uuid) from public, anon, authenticated;
revoke all on function public.select_visual_assets_v1(text, integer) from public, anon, authenticated;
grant execute on function public.resolve_design_tokens_v1(uuid) to service_role;
grant execute on function public.select_visual_assets_v1(text, integer) to service_role;
