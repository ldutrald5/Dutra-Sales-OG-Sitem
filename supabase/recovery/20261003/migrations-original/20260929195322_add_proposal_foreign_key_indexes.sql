
create index if not exists proposal_references_reference_client_idx
  on public.proposal_references (reference_client_id);

create index if not exists proposals_created_by_idx
  on public.proposals (created_by)
  where created_by is not null;

create index if not exists proposals_financial_parameter_set_idx
  on public.proposals (financial_parameter_set_id)
  where financial_parameter_set_id is not null;

create index if not exists proposals_proposal_template_idx
  on public.proposals (proposal_template_id)
  where proposal_template_id is not null;

create index if not exists proposals_vehicle_profile_idx
  on public.proposals (vehicle_profile_id)
  where vehicle_profile_id is not null;
