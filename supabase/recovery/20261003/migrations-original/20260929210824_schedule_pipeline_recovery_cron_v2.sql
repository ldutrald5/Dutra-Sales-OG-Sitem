
select cron.schedule(
  'og-pipeline-recovery',
  '*/2 * * * *',
  $cron$
  select net.http_post(
    url := (
      select rtrim(decrypted_secret, '/') || '/functions/v1/pipeline-recovery'
      from vault.decrypted_secrets
      where name = 'og_project_url'
      limit 1
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-og-cron-token', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'og_pipeline_cron_token'
        limit 1
      )
    ),
    body := jsonb_build_object('source', 'pg_cron', 'time', now()),
    timeout_milliseconds := 30000
  );
  $cron$
);
