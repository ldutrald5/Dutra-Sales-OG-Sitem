
create table if not exists public.sector_taxonomy (
  code text primary key,
  name text not null,
  description text,
  aliases text[] not null default '{}'::text[],
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.sector_taxonomy (code, name, description, aliases, priority)
values
  ('agro', 'Agronegócio', 'Cooperativas, grãos, insumos, produção e logística agrícola.',
    array['agribusiness','agronegocio','agronegócio','agro','agriculture','agricultura','cooperativa agricola','cooperativa agrícola','graos','grãos','commodities agricolas','commodities agrícolas'], 100),
  ('transport', 'Transportes', 'Transportadoras rodoviárias e operadores de transporte de cargas.',
    array['transport','transportes','transportadora','road freight','freight transportation','transporte rodoviario','transporte rodoviário','cargas'], 100),
  ('logistics', 'Logística', 'Operadores logísticos, centros de distribuição e supply chain.',
    array['logistics','logistica','logística','operador logistico','operador logístico','supply chain','armazenagem'], 90),
  ('construction', 'Construção', 'Construção civil, concreto, agregados e materiais de construção.',
    array['construction','construcao','construção','concreto','concrete','cimento','cement','agregados','materiais de construcao','materiais de construção'], 90),
  ('mining', 'Mineração', 'Mineração, pedreiras e extração mineral.',
    array['mining','mineracao','mineração','pedreira','quarry','minerais','mineral extraction'], 90),
  ('distribution', 'Distribuição', 'Distribuidores, atacadistas e redes de distribuição.',
    array['distribution','distribuicao','distribuição','distribuidor','atacado','wholesale'], 80),
  ('food', 'Alimentos', 'Indústria e distribuição de alimentos e bebidas.',
    array['food','alimentos','bebidas','beverages','food industry','industria de alimentos','indústria de alimentos'], 80),
  ('industrial', 'Industrial', 'Indústrias e manufatura sem categoria mais específica.',
    array['industrial','industry','industria','indústria','manufacturing','manufatura'], 60),
  ('forestry', 'Florestal', 'Silvicultura, madeira, papel e celulose.',
    array['forestry','florestal','silvicultura','madeira','wood','papel','paper','celulose','pulp'], 70),
  ('waste', 'Resíduos', 'Coleta, reciclagem, saneamento e gestão de resíduos.',
    array['waste','residuos','resíduos','reciclagem','recycling','saneamento','coleta de residuos','coleta de resíduos'], 70),
  ('other', 'Outros', 'Categoria de fallback quando não há classificação confiável.',
    array['other','outros'], 0)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  aliases = excluded.aliases,
  priority = excluded.priority,
  updated_at = now();

create table if not exists public.company_discovery_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  enrichment_job_id uuid references public.enrichment_jobs(id) on delete set null,
  source_type text not null
    check (source_type in ('official_site','search_result','social','directory','registry','manual','other')),
  provider text not null,
  source_url text,
  is_official boolean not null default false,
  confidence numeric(5,4)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  extracted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists company_discovery_sources_company_idx
  on public.company_discovery_sources (company_id, created_at desc);

create index if not exists company_discovery_sources_job_idx
  on public.company_discovery_sources (enrichment_job_id, created_at desc)
  where enrichment_job_id is not null;

create table if not exists public.company_brand_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_type text not null
    check (asset_type in ('logo','favicon','hero','photo','brand_palette')),
  source_url text,
  storage_bucket text,
  storage_path text,
  data_uri_hash text,
  mime_type text,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  confidence numeric(5,4)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'discovered'
    check (status in ('discovered','pending_copy','stored','rejected','failed')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_brand_assets_company_idx
  on public.company_brand_assets (company_id, asset_type, is_primary desc, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  false,
  15728640,
  array['image/svg+xml','image/png','image/jpeg','image/webp','image/x-icon']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.sector_taxonomy enable row level security;
alter table public.company_discovery_sources enable row level security;
alter table public.company_brand_assets enable row level security;

revoke all on table public.sector_taxonomy from anon, authenticated;
revoke all on table public.company_discovery_sources from anon, authenticated;
revoke all on table public.company_brand_assets from anon, authenticated;

grant select, insert, update, delete on table public.sector_taxonomy to service_role;
grant select, insert, update, delete on table public.company_discovery_sources to service_role;
grant select, insert, update, delete on table public.company_brand_assets to service_role;

create or replace function public.normalize_sector_v1(
  p_sector_raw text,
  p_subsectors text[] default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_input text;
  v_code text;
  v_name text;
  v_score numeric := 0;
begin
  v_input := lower(
    coalesce(p_sector_raw, '') || ' ' ||
    coalesce(array_to_string(p_subsectors, ' '), '')
  );

  select st.code, st.name,
         case
           when lower(coalesce(p_sector_raw,'')) = any(st.aliases) then 1.0
           else 0.75
         end
    into v_code, v_name, v_score
  from public.sector_taxonomy st
  where st.active = true
    and st.code <> 'other'
    and exists (
      select 1
      from unnest(st.aliases) a
      where v_input like '%' || lower(a) || '%'
    )
  order by
    case when lower(coalesce(p_sector_raw,'')) = any(st.aliases) then 1 else 0 end desc,
    st.priority desc
  limit 1;

  if v_code is null then
    v_code := 'other';
    v_name := 'Outros';
    v_score := 0.30;
  end if;

  return jsonb_build_object(
    'code', v_code,
    'name', v_name,
    'score', v_score,
    'raw', p_sector_raw,
    'subsectors', coalesce(to_jsonb(p_subsectors), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.normalize_sector_v1(text, text[]) from public, anon, authenticated;
grant execute on function public.normalize_sector_v1(text, text[]) to service_role;
