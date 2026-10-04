
alter table public.financial_parameter_sets
  add column if not exists package_price_per_vehicle numeric(14,2)
    check (package_price_per_vehicle is null or package_price_per_vehicle >= 0),
  add column if not exists tire_cycle_months numeric(10,2)
    check (tire_cycle_months is null or tire_cycle_months > 0);

update public.vehicle_profiles
set
  equalizers_per_vehicle = 18,
  notes = 'Rodotrem 9 eixos: 36 pneus. Premissa OG registrada: uma peça atende/protege dois pneus, resultando em 18 peças por veículo. Quantidade de suportes permanece pendente de tabela técnica.'
where code = 'rodotrem_9_eixos';

update public.financial_parameter_sets
set
  tire_price = 2000,
  tire_cycle_months = 18,
  annual_tire_replacement_factor = 12.0 / 18.0,
  tire_life_gain = 0.20,
  package_price_per_vehicle = 4230,
  assumptions = assumptions || jsonb_build_object(
    'payment_terms', '6x de R$ 705 por veículo no exemplo comercial registrado',
    'freight', 'aprox. R$ 120 no exemplo comercial; negociar e não incluir automaticamente',
    'training', 'incluso',
    'source_note', 'Parâmetros consolidados de proposta OG anterior; diesel permanece sem base monetária padrão.'
  )
where version = '2026.09-initial';

create or replace function public.calculate_proposal_v2(
  p_fleet_size integer,
  p_vehicle_profile_code text default 'rodotrem_9_eixos',
  p_financial_version text default null,
  p_monthly_km numeric default null,
  p_consumption_km_l numeric default null,
  p_diesel_price numeric default null,
  p_monthly_diesel_cost_per_vehicle numeric default null,
  p_tire_price numeric default null,
  p_tire_replacement_factor numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile public.vehicle_profiles%rowtype;
  v_fin public.financial_parameter_sets%rowtype;

  v_monthly_km numeric;
  v_consumption numeric;
  v_diesel_price numeric;
  v_tire_price numeric;
  v_replacement_factor numeric;

  v_total_tires integer;
  v_total_equalizers numeric;
  v_total_supports numeric;
  v_investment numeric;
  v_protected_assets numeric;
  v_annual_diesel_liters numeric;
  v_annual_diesel_cost numeric;
  v_fuel_savings_min numeric;
  v_fuel_savings_default numeric;
  v_fuel_savings_max numeric;
  v_tire_savings numeric;
  v_total_savings numeric;
  v_roi numeric;
  v_payback numeric;

  v_blockers text[] := array[]::text[];
  v_warnings text[] := array[]::text[];
  v_status text;
begin
  if p_fleet_size is null or p_fleet_size <= 0 then
    raise exception 'fleet_size must be greater than zero';
  end if;

  select *
  into v_profile
  from public.vehicle_profiles
  where code = p_vehicle_profile_code
    and active = true
  limit 1;

  if not found then
    raise exception 'vehicle profile not found: %', p_vehicle_profile_code;
  end if;

  if p_financial_version is null then
    select *
    into v_fin
    from public.financial_parameter_sets
    where active = true
      and valid_from <= current_date
      and (valid_until is null or valid_until >= current_date)
    order by valid_from desc, created_at desc
    limit 1;
  else
    select *
    into v_fin
    from public.financial_parameter_sets
    where version = p_financial_version
    limit 1;
  end if;

  if v_fin.id is null then
    raise exception 'financial parameter set not found';
  end if;

  v_monthly_km := coalesce(p_monthly_km, v_profile.avg_monthly_km);
  v_consumption := coalesce(p_consumption_km_l, v_profile.avg_consumption_km_l);
  v_diesel_price := coalesce(p_diesel_price, v_fin.diesel_price);
  v_tire_price := coalesce(p_tire_price, v_fin.tire_price, v_profile.default_tire_price);
  v_replacement_factor := coalesce(
    p_tire_replacement_factor,
    v_fin.annual_tire_replacement_factor,
    case when v_fin.tire_cycle_months is not null then 12.0 / v_fin.tire_cycle_months else null end
  );

  v_total_tires := p_fleet_size * v_profile.tires_per_vehicle;

  if v_profile.equalizers_per_vehicle is not null then
    v_total_equalizers := p_fleet_size * v_profile.equalizers_per_vehicle;
  else
    v_warnings := array_append(v_warnings, 'equalizers_per_vehicle_missing');
  end if;

  if v_profile.supports_per_vehicle is not null then
    v_total_supports := p_fleet_size * v_profile.supports_per_vehicle;
  else
    v_warnings := array_append(v_warnings, 'supports_per_vehicle_missing');
  end if;

  if v_tire_price is not null then
    v_protected_assets := v_total_tires * v_tire_price;
  else
    v_blockers := array_append(v_blockers, 'tire_price');
  end if;

  if v_fin.package_price_per_vehicle is not null then
    v_investment :=
      (p_fleet_size * v_fin.package_price_per_vehicle)
      + coalesce(v_fin.installation_cost, 0);
  elsif v_total_equalizers is not null
     and v_total_supports is not null
     and v_fin.equalizer_unit_price is not null
     and v_fin.support_unit_price is not null
  then
    v_investment :=
      (v_total_equalizers * v_fin.equalizer_unit_price)
      + (v_total_supports * v_fin.support_unit_price)
      + coalesce(v_fin.installation_cost, 0);
  else
    v_blockers := array_append(v_blockers, 'investment_pricing');
  end if;

  if v_tire_price is not null and v_replacement_factor is not null then
    v_tire_savings :=
      v_total_tires
      * v_tire_price
      * v_replacement_factor
      * v_fin.tire_life_gain;
  else
    if v_replacement_factor is null then
      v_blockers := array_append(v_blockers, 'tire_replacement_factor');
    end if;
  end if;

  if p_monthly_diesel_cost_per_vehicle is not null then
    if p_monthly_diesel_cost_per_vehicle < 0 then
      raise exception 'monthly_diesel_cost_per_vehicle cannot be negative';
    end if;
    v_annual_diesel_cost := p_fleet_size * p_monthly_diesel_cost_per_vehicle * 12;
  elsif v_monthly_km is not null
     and v_consumption is not null
     and v_diesel_price is not null
  then
    v_annual_diesel_liters := (p_fleet_size * v_monthly_km * 12) / v_consumption;
    v_annual_diesel_cost := v_annual_diesel_liters * v_diesel_price;
  else
    v_warnings := array_append(v_warnings, 'diesel_cost_base_missing');
  end if;

  if v_annual_diesel_cost is not null then
    v_fuel_savings_min := v_annual_diesel_cost * v_fin.diesel_savings_min;
    v_fuel_savings_default := v_annual_diesel_cost * v_fin.diesel_savings_default;
    v_fuel_savings_max := v_annual_diesel_cost * v_fin.diesel_savings_max;
  end if;

  v_total_savings := coalesce(v_tire_savings, 0) + coalesce(v_fuel_savings_default, 0);

  if v_investment is not null and v_investment > 0 and v_total_savings > 0 then
    v_roi :=
      ((v_total_savings - coalesce(v_fin.annual_operational_cost, 0)) / v_investment) * 100;
    v_payback := v_investment / (v_total_savings / 12);
  end if;

  if coalesce(array_length(v_blockers, 1), 0) > 0 then
    v_status := 'needs_configuration';
  elsif v_annual_diesel_cost is null then
    v_status := 'ready_partial';
  else
    v_status := 'ready';
  end if;

  return jsonb_build_object(
    'engine', jsonb_build_object(
      'name', 'og-proposal-calculator',
      'version', '2.0.0',
      'status', v_status,
      'calculation_scope',
        case
          when v_status = 'ready' then 'tires_and_fuel'
          when v_status = 'ready_partial' then 'tires_only'
          else 'incomplete'
        end
    ),
    'input', jsonb_build_object(
      'fleet_size', p_fleet_size,
      'vehicle_profile_code', p_vehicle_profile_code,
      'financial_version', v_fin.version
    ),
    'fleet', jsonb_build_object(
      'vehicles', p_fleet_size,
      'tires_per_vehicle', v_profile.tires_per_vehicle,
      'total_tires', v_total_tires,
      'equalizers_per_vehicle', v_profile.equalizers_per_vehicle,
      'total_equalizers', v_total_equalizers,
      'supports_per_vehicle', v_profile.supports_per_vehicle,
      'total_supports', v_total_supports
    ),
    'assumptions', jsonb_build_object(
      'monthly_km', v_monthly_km,
      'consumption_km_l', v_consumption,
      'diesel_price', v_diesel_price,
      'monthly_diesel_cost_per_vehicle', p_monthly_diesel_cost_per_vehicle,
      'tire_price', v_tire_price,
      'tire_cycle_months', v_fin.tire_cycle_months,
      'annual_tire_replacement_factor', v_replacement_factor,
      'tire_life_gain', v_fin.tire_life_gain,
      'diesel_savings_min', v_fin.diesel_savings_min,
      'diesel_savings_default', v_fin.diesel_savings_default,
      'diesel_savings_max', v_fin.diesel_savings_max,
      'package_price_per_vehicle', v_fin.package_price_per_vehicle
    ),
    'investment', jsonb_build_object(
      'total', v_investment,
      'package_price_per_vehicle', v_fin.package_price_per_vehicle
    ),
    'roi', jsonb_build_object(
      'protected_asset_value', v_protected_assets,
      'annual_diesel_liters', v_annual_diesel_liters,
      'annual_diesel_cost', v_annual_diesel_cost,
      'annual_fuel_savings_min', v_fuel_savings_min,
      'annual_fuel_savings_default', v_fuel_savings_default,
      'annual_fuel_savings_max', v_fuel_savings_max,
      'annual_tire_savings', v_tire_savings,
      'annual_total_savings', v_total_savings,
      'roi_percent', v_roi,
      'payback_months', v_payback
    ),
    'blocking_configuration', to_jsonb(v_blockers),
    'warnings', to_jsonb(v_warnings)
  );
end;
$$;

revoke all on function public.calculate_proposal_v2(
  integer, text, text, numeric, numeric, numeric, numeric, numeric, numeric
) from public, anon, authenticated;

grant execute on function public.calculate_proposal_v2(
  integer, text, text, numeric, numeric, numeric, numeric, numeric, numeric
) to service_role;
