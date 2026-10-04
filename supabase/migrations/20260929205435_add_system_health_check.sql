
create or replace function public.system_health_v1()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile public.vehicle_profiles%rowtype;
  v_fin public.financial_parameter_sets%rowtype;
  v_ready_refs integer;
  v_visual_assets integer;
  v_pending_enrichment integer;
  v_pending_render integer;
  v_failed_jobs integer;
  v_warnings jsonb := '[]'::jsonb;
  v_score integer := 100;
begin
  select * into v_profile
  from public.vehicle_profiles
  where code = 'rodotrem_9_eixos'
  limit 1;

  select * into v_fin
  from public.financial_parameter_sets
  where active = true
  order by valid_from desc, created_at desc
  limit 1;

  select count(*) into v_ready_refs
  from public.reference_clients
  where active = true
    and approved_for_marketing = true;

  select count(*) into v_visual_assets
  from public.visual_asset_library
  where active = true
    and approved_for_commercial_use = true;

  select count(*) into v_pending_enrichment
  from public.enrichment_jobs
  where status in ('pending','processing','needs_review');

  select count(*) into v_pending_render
  from public.render_jobs
  where status in ('waiting','pending','processing');

  select
    (select count(*) from public.enrichment_jobs where status = 'failed')
    +
    (select count(*) from public.render_jobs where status = 'failed')
    +
    (select count(*) from public.company_brand_assets where status = 'failed')
  into v_failed_jobs;

  if v_profile.id is null then
    v_warnings := v_warnings || jsonb_build_array(
      jsonb_build_object('code','vehicle_profile_missing','severity','critical','message','Perfil rodotrem_9_eixos não existe.')
    );
    v_score := v_score - 25;
  else
    if v_profile.supports_per_vehicle is null then
      v_warnings := v_warnings || jsonb_build_array(
        jsonb_build_object('code','supports_per_vehicle_missing','severity','warning','message','Quantidade de suportes por veículo ainda não foi validada.')
      );
      v_score := v_score - 5;
    end if;
  end if;

  if v_fin.id is null then
    v_warnings := v_warnings || jsonb_build_array(
      jsonb_build_object('code','financial_parameters_missing','severity','critical','message','Não existe conjunto financeiro ativo.')
    );
    v_score := v_score - 25;
  else
    if v_fin.package_price_per_vehicle is null then
      v_warnings := v_warnings || jsonb_build_array(
        jsonb_build_object('code','package_price_missing','severity','critical','message','Preço do pacote por veículo não configurado.')
      );
      v_score := v_score - 20;
    end if;

    if v_fin.tire_price is null then
      v_warnings := v_warnings || jsonb_build_array(
        jsonb_build_object('code','tire_price_missing','severity','warning','message','Preço médio de pneu não configurado.')
      );
      v_score := v_score - 10;
    end if;

    if v_fin.diesel_price is null then
      v_warnings := v_warnings || jsonb_build_array(
        jsonb_build_object('code','diesel_base_missing','severity','info','message','Sem base padrão de diesel; ROI de combustível depende de dado do cliente.')
      );
      v_score := v_score - 2;
    end if;
  end if;

  if v_ready_refs = 0 then
    v_warnings := v_warnings || jsonb_build_array(
      jsonb_build_object('code','reference_clients_empty','severity','warning','message','Nenhum cliente de referência está aprovado para prova social.')
    );
    v_score := v_score - 8;
  end if;

  if v_visual_assets = 0 then
    v_warnings := v_warnings || jsonb_build_array(
      jsonb_build_object('code','licensed_visual_assets_empty','severity','warning','message','Biblioteca de fotos comerciais licenciadas ainda está vazia; renderer usará layout sem foto.')
    );
    v_score := v_score - 8;
  end if;

  if v_failed_jobs > 0 then
    v_warnings := v_warnings || jsonb_build_array(
      jsonb_build_object('code','failed_jobs_present','severity','warning','message','Existem jobs com falha que precisam de inspeção.','count',v_failed_jobs)
    );
    v_score := v_score - least(10, v_failed_jobs);
  end if;

  v_score := greatest(0, least(100, v_score));

  return jsonb_build_object(
    'status',
      case
        when v_score >= 90 then 'production_ready_core'
        when v_score >= 75 then 'mvp_ready_with_warnings'
        when v_score >= 50 then 'development_ready'
        else 'blocked'
      end,
    'readiness_score', v_score,
    'core', jsonb_build_object(
      'vehicle_profile_ready', v_profile.id is not null,
      'financial_parameters_ready', v_fin.id is not null,
      'package_price_per_vehicle', v_fin.package_price_per_vehicle,
      'tire_price', v_fin.tire_price,
      'diesel_price', v_fin.diesel_price,
      'approved_reference_clients', v_ready_refs,
      'approved_visual_assets', v_visual_assets
    ),
    'queue', jsonb_build_object(
      'pending_enrichment', v_pending_enrichment,
      'pending_render', v_pending_render,
      'failed_jobs', v_failed_jobs
    ),
    'warnings', v_warnings,
    'checked_at', now()
  );
end;
$$;

revoke all on function public.system_health_v1() from public, anon, authenticated;
grant execute on function public.system_health_v1() to service_role;
