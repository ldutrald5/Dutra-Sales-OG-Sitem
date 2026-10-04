
alter table public.financial_parameter_sets
  add column if not exists annual_tire_replacement_factor numeric(8,6)
  check (
    annual_tire_replacement_factor is null
    or annual_tire_replacement_factor >= 0
  );

create or replace function public.calculate_proposal_v1(
  p_fleet_size integer,
  p_vehicle_profile_code text default 'rodotrem_9_eixos',
  p_financial_version text default null,
  p_monthly_km numeric default null,
  p_consumption_km_l numeric default null,
  p_diesel_price numeric default null,
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

  v_missing text[] := array[]::text[];
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
  v_replacement_factor := coalesce(p_tire_replacement_factor, v_fin.annual_tire_replacement_factor);

  v_total_tires := p_fleet_size * v_profile.tires_per_vehicle;

  if v_profile.equalizers_per_vehicle is not null then
    v_total_equalizers := p_fleet_size * v_profile.equalizers_per_vehicle;
  else
    v_missing := array_append(v_missing, 'equalizers_per_vehicle');
  end if;

  if v_profile.supports_per_vehicle is not null then
    v_total_supports := p_fleet_size * v_profile.supports_per_vehicle;
  else
    v_missing := array_append(v_missing, 'supports_per_vehicle');
  end if;

  if v_tire_price is not null then
    v_protected_assets := v_total_tires * v_tire_price;
  else
    v_missing := array_append(v_missing, 'tire_price');
  end if;

  if v_total_equalizers is not null
     and v_total_supports is not null
     and v_fin.equalizer_unit_price is not null
     and v_fin.support_unit_price is not null
  then
    v_investment :=
      (v_total_equalizers * v_fin.equalizer_unit_price)
      + (v_total_supports * v_fin.support_unit_price)
      + coalesce(v_fin.installation_cost, 0);
  else
    if v_fin.equalizer_unit_price is null then
      v_missing := array_append(v_missing, 'equalizer_unit_price');
    end if;
    if v_fin.support_unit_price is null then
      v_missing := array_append(v_missing, 'support_unit_price');
    end if;
  end if;

  if v_monthly_km is null then
    v_missing := array_append(v_missing, 'avg_monthly_km');
  end if;
  if v_consumption is null then
    v_missing := array_append(v_missing, 'avg_consumption_km_l');
  end if;
  if v_diesel_price is null then
    v_missing := array_append(v_missing, 'diesel_price');
  end if;

  if v_monthly_km is not null
     and v_consumption is not null
     and v_diesel_price is not null
  then
    v_annual_diesel_liters := (p_fleet_size * v_monthly_km * 12) / v_consumption;
    v_annual_diesel_cost := v_annual_diesel_liters * v_diesel_price;

    v_fuel_savings_min := v_annual_diesel_cost * v_fin.diesel_savings_min;
    v_fuel_savings_default := v_annual_diesel_cost * v_fin.diesel_savings_default;
    v_fuel_savings_max := v_annual_diesel_cost * v_fin.diesel_savings_max;
  end if;

  if v_tire_price is not null and v_replacement_factor is not null then
    v_tire_savings :=
      v_total_tires
      * v_tire_price
      * v_replacement_factor
      * v_fin.tire_life_gain;
  else
    if v_replacement_factor is null then
      v_missing := array_append(v_missing, 'annual_tire_replacement_factor');
    end if;
  end if;

  if v_fuel_savings_default is not null and v_tire_savings is not null then
    v_total_savings := v_fuel_savings_default + v_tire_savings;
  end if;

  if v_total_savings is not null and v_investment is not null and v_investment > 0 then
    v_roi :=
      ((v_total_savings - coalesce(v_fin.annual_operational_cost, 0)) / v_investment) * 100;

    if v_total_savings > 0 then
      v_payback := v_investment / (v_total_savings / 12);
    end if;
  end if;

  select array_agg(distinct x order by x)
  into v_missing
  from unnest(v_missing) as t(x);

  return jsonb_build_object(
    'engine', jsonb_build_object(
      'name', 'og-proposal-calculator',
      'version', '1.0.0',
      'status', case when coalesce(array_length(v_missing, 1), 0) = 0 then 'ready' else 'needs_configuration' end
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
      'tire_price', v_tire_price,
      'annual_tire_replacement_factor', v_replacement_factor,
      'tire_life_gain', v_fin.tire_life_gain,
      'diesel_savings_min', v_fin.diesel_savings_min,
      'diesel_savings_default', v_fin.diesel_savings_default,
      'diesel_savings_max', v_fin.diesel_savings_max
    ),
    'investment', jsonb_build_object(
      'total', v_investment
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
    'missing_configuration', coalesce(to_jsonb(v_missing), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.calculate_proposal_v1(
  integer, text, text, numeric, numeric, numeric, numeric, numeric
) from public, anon, authenticated;

grant execute on function public.calculate_proposal_v1(
  integer, text, text, numeric, numeric, numeric, numeric, numeric
) to service_role;
