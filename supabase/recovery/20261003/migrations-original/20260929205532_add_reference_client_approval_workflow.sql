
alter table public.reference_clients
  add column if not exists relationship_status text not null default 'candidate'
    check (relationship_status in ('candidate','confirmed_client','former_client','prospect')),
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected')),
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists confirmed_at timestamptz,
  add column if not exists approved_at timestamptz;

create unique index if not exists reference_clients_name_unique_idx
  on public.reference_clients (lower(company_name));

insert into public.reference_clients (
  company_name,
  sector,
  priority,
  approved_for_marketing,
  active,
  relationship_status,
  approval_status,
  evidence,
  confirmed_at
)
values (
  'SJ TRANSPORTES LTDA',
  'other',
  50,
  false,
  true,
  'confirmed_client',
  'pending',
  jsonb_build_object(
    'source', 'crm_history',
    'relationship_evidence', 'Registro anterior marcou status fechado/originalStatus Cliente e informou que já usa Olho de Gato nos caminhões.',
    'marketing_authorization', 'not_confirmed'
  ),
  now()
)
on conflict (lower(company_name)) do update set
  relationship_status = 'confirmed_client',
  approval_status = case
    when public.reference_clients.approval_status = 'approved' then 'approved'
    else 'pending'
  end,
  approved_for_marketing = case
    when public.reference_clients.approval_status = 'approved' then true
    else false
  end,
  evidence = public.reference_clients.evidence || excluded.evidence,
  confirmed_at = coalesce(public.reference_clients.confirmed_at, excluded.confirmed_at),
  updated_at = now();

create or replace function public.approve_reference_client_v1(
  p_reference_id uuid,
  p_sector text,
  p_approval_note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ref public.reference_clients%rowtype;
begin
  if not exists (
    select 1
    from public.sector_taxonomy
    where code = p_sector
      and active = true
  ) then
    raise exception 'invalid or inactive sector: %', p_sector;
  end if;

  update public.reference_clients
  set
    sector = p_sector,
    approved_for_marketing = true,
    approval_status = 'approved',
    approval_note = p_approval_note,
    approved_at = now(),
    updated_at = now()
  where id = p_reference_id
    and relationship_status in ('confirmed_client','former_client')
  returning * into v_ref;

  if not found then
    raise exception 'reference client not found or relationship not eligible for approval: %', p_reference_id;
  end if;

  return jsonb_build_object(
    'id', v_ref.id,
    'company_name', v_ref.company_name,
    'sector', v_ref.sector,
    'relationship_status', v_ref.relationship_status,
    'approval_status', v_ref.approval_status,
    'approved_for_marketing', v_ref.approved_for_marketing,
    'approved_at', v_ref.approved_at
  );
end;
$$;

create or replace function public.reject_reference_client_v1(
  p_reference_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ref public.reference_clients%rowtype;
begin
  update public.reference_clients
  set
    approved_for_marketing = false,
    approval_status = 'rejected',
    approval_note = p_reason,
    approved_at = null,
    updated_at = now()
  where id = p_reference_id
  returning * into v_ref;

  if not found then
    raise exception 'reference client not found: %', p_reference_id;
  end if;

  return jsonb_build_object(
    'id', v_ref.id,
    'company_name', v_ref.company_name,
    'approval_status', v_ref.approval_status,
    'approved_for_marketing', v_ref.approved_for_marketing
  );
end;
$$;

revoke all on function public.approve_reference_client_v1(uuid, text, text) from public, anon, authenticated;
revoke all on function public.reject_reference_client_v1(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_reference_client_v1(uuid, text, text) to service_role;
grant execute on function public.reject_reference_client_v1(uuid, text) to service_role;
