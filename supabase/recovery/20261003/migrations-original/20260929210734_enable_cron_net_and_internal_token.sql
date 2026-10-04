
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table if not exists public.internal_service_tokens (
  name text primary key,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

alter table public.internal_service_tokens enable row level security;
revoke all on table public.internal_service_tokens from anon, authenticated;
grant select, insert, update on table public.internal_service_tokens to service_role;

do $$
declare
  v_token text;
  v_secret_id uuid;
begin
  select id, decrypted_secret
  into v_secret_id, v_token
  from vault.decrypted_secrets
  where name = 'og_pipeline_cron_token'
  limit 1;

  if v_secret_id is null then
    v_token := encode(gen_random_bytes(32), 'hex');
    perform vault.create_secret(
      v_token,
      'og_pipeline_cron_token',
      'Internal token used only by Postgres Cron to invoke the OG pipeline recovery worker.'
    );
  end if;

  insert into public.internal_service_tokens(name, token_hash, active)
  values (
    'og_pipeline_cron_token',
    encode(digest(v_token, 'sha256'), 'hex'),
    true
  )
  on conflict (name) do update set
    token_hash = excluded.token_hash,
    active = true,
    rotated_at = now();

  if not exists (
    select 1 from vault.decrypted_secrets where name = 'og_project_url'
  ) then
    perform vault.create_secret(
      'https://hlyffyguxqxmgxlevfeq.supabase.co',
      'og_project_url',
      'OG Proposal Engine Supabase project URL for internal cron invocations.'
    );
  end if;
end
$$;
