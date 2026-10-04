
create index if not exists ai_briefings_contact_idx on public.ai_briefings (contact_id);
create index if not exists ai_briefings_opportunity_idx on public.ai_briefings (opportunity_id);
create index if not exists ai_briefings_session_idx on public.ai_briefings (session_id);
create index if not exists call_attempts_list_member_idx on public.call_attempts (list_member_id);
create index if not exists lead_list_members_primary_contact_idx on public.lead_list_members (primary_contact_id);
create index if not exists meetings_primary_contact_idx on public.meetings (primary_contact_id);
create index if not exists prospecting_sessions_current_member_idx on public.prospecting_sessions (current_member_id);
