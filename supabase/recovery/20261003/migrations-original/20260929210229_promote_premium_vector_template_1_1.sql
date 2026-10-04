
insert into public.proposal_templates (
  code,
  version,
  renderer,
  template_path,
  schema_version,
  active,
  metadata
)
values (
  'og-premium-5-pages',
  '1.1.0',
  'other',
  'edge://proposal-pdf-premium',
  '1.0.0',
  true,
  jsonb_build_object(
    'pages', 5,
    'renderer', 'pdf-lib-vector-premium',
    'supports_brand_tokens', true,
    'supports_internal_logo', true,
    'supports_reference_clients', true,
    'status', 'active'
  )
)
on conflict (code, version) do update set
  renderer = excluded.renderer,
  template_path = excluded.template_path,
  active = true,
  metadata = excluded.metadata;

update public.proposal_templates
set active = false
where code = 'og-premium-5-pages'
  and version <> '1.1.0';
