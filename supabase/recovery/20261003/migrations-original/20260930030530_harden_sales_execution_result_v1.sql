-- Harden the confirmed-call command: no stage regression, explicit meeting facts, and canonical opportunity creation.
create or replace function public.record_sales_execution_result_v1(p_command jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_external_id text := nullif(trim(p_command->>'externalId'),'');
  v_company_id uuid := nullif(p_command->>'companyId','')::uuid;
  v_contact_id uuid := nullif(p_command->>'contactId','')::uuid;
  v_session_id uuid := nullif(p_command->>'sessionId','')::uuid;
  v_member_id uuid := nullif(p_command->>'memberId','')::uuid;
  v_opportunity_id uuid := nullif(p_command->>'opportunityId','')::uuid;
  v_outcome text := upper(nullif(trim(p_command->>'result'),''));
  v_note text := nullif(left(trim(coalesce(p_command->>'note','')),2000),'');
  v_next_action_type text := upper(nullif(trim(p_command->>'nextActionType'),''));
  v_next_action_at timestamptz := nullif(p_command->>'nextActionAt','')::timestamptz;
  v_stage text;
  v_current_stage text;
  v_effective_stage text;
  v_attempt public.call_attempts%rowtype;
  v_activity_id uuid;
  v_meeting_id uuid;
  v_next_member_id uuid;
  v_meeting jsonb := coalesce(p_command->'meeting','{}'::jsonb);
  v_meeting_mode text := upper(nullif(trim(p_command->'meeting'->>'mode'),''));
  v_meeting_duration int := coalesce(nullif(p_command->'meeting'->>'durationMinutes','')::int,30);
begin
  if v_external_id is null or v_company_id is null then
    raise exception 'externalId and companyId are required';
  end if;

  if v_outcome not in ('NO_ANSWER','INVALID_NUMBER','GATEKEEPER','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_REACHED','RETURN_LATER','QUALIFIED','MEETING_BOOKED','SEND_MATERIAL','PROPOSAL','NOT_INTERESTED') then
    raise exception 'invalid call result';
  end if;

  if v_outcome='MEETING_BOOKED' then
    if nullif(v_meeting->>'scheduledAt','') is null then raise exception 'meeting.scheduledAt required for MEETING_BOOKED'; end if;
    if v_meeting_mode not in ('ONLINE','PRESENCIAL','PHONE') then raise exception 'meeting.mode required for MEETING_BOOKED'; end if;
    if v_meeting_duration < 5 or v_meeting_duration > 480 then raise exception 'meeting.durationMinutes out of range'; end if;
  end if;

  insert into public.call_attempts(
    session_id,list_member_id,company_id,contact_id,ended_at,outcome,
    connected,decision_maker_reached,qualified,notes,metadata,external_id
  )
  values(
    v_session_id,v_member_id,v_company_id,v_contact_id,now(),v_outcome,
    v_outcome in ('GATEKEEPER','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','SEND_MATERIAL','PROPOSAL'),
    v_outcome in ('DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','PROPOSAL'),
    v_outcome in ('QUALIFIED','MEETING_BOOKED','PROPOSAL'),
    v_note,jsonb_build_object('source','dutra_os','command','record_sales_execution_result_v1'),v_external_id
  )
  on conflict (external_id) do nothing
  returning * into v_attempt;

  if v_attempt.id is null then
    select * into v_attempt from public.call_attempts where external_id=v_external_id limit 1;
    return jsonb_build_object('duplicate',true,'callAttemptId',v_attempt.id,'outcome',v_attempt.outcome);
  end if;

  v_stage := case v_outcome
    when 'NO_ANSWER' then 'CONTACT_ATTEMPTED'
    when 'INVALID_NUMBER' then 'CONTACT_ATTEMPTED'
    when 'GATEKEEPER' then 'CONNECTED'
    when 'DECISION_MAKER_IDENTIFIED' then 'DECISION_MAKER_IDENTIFIED'
    when 'DECISION_MAKER_REACHED' then 'DECISION_MAKER_CONTACTED'
    when 'RETURN_LATER' then 'CONNECTED'
    when 'QUALIFIED' then 'QUALIFIED'
    when 'MEETING_BOOKED' then 'MEETING_SCHEDULED'
    when 'SEND_MATERIAL' then 'CONNECTED'
    when 'PROPOSAL' then 'PROPOSAL'
    when 'NOT_INTERESTED' then 'LOST'
  end;

  if v_contact_id is not null and v_outcome='GATEKEEPER' then
    update public.crm_contacts
      set decision_level='gatekeeper', updated_at=now()
      where id=v_contact_id and (decision_level='unknown' or decision_level is null);
  elsif v_contact_id is not null and v_outcome in ('DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','PROPOSAL') then
    update public.crm_contacts
      set decision_level='decision_maker', updated_at=now()
      where id=v_contact_id;
  end if;

  if v_opportunity_id is null then
    select id into v_opportunity_id
    from public.sales_opportunities
    where company_id=v_company_id
      and pipeline_stage not in ('WON','LOST')
    order by updated_at desc
    limit 1;
  end if;

  if v_opportunity_id is null then
    insert into public.sales_opportunities(
      company_id,primary_contact_id,source,stage,pipeline_stage,next_action_type,next_action_due_at,notes,metadata
    )
    values(
      v_company_id,v_contact_id,'prospecting','lead','PROSPECT',v_next_action_type,v_next_action_at,v_note,
      jsonb_build_object('source','dutra_os','created_by_command','record_sales_execution_result_v1')
    )
    returning id,pipeline_stage into v_opportunity_id,v_current_stage;
  else
    select pipeline_stage into v_current_stage
    from public.sales_opportunities
    where id=v_opportunity_id and company_id=v_company_id;
    if v_current_stage is null then raise exception 'opportunity does not belong to company'; end if;
  end if;

  v_effective_stage := v_current_stage;
  if v_outcome='NOT_INTERESTED' then
    v_effective_stage := 'LOST';
  elsif
    (case v_stage
      when 'PROSPECT' then 0 when 'CONTACT_ATTEMPTED' then 1 when 'CONNECTED' then 2
      when 'DECISION_MAKER_IDENTIFIED' then 3 when 'DECISION_MAKER_CONTACTED' then 4
      when 'QUALIFIED' then 5 when 'MEETING_TO_SCHEDULE' then 6 when 'MEETING_SCHEDULED' then 7
      when 'MEETING_COMPLETED' then 8 when 'PROPOSAL' then 9 when 'NEGOTIATION' then 10
      when 'WON' then 11 when 'LOST' then 12 else -1 end)
    >
    (case v_current_stage
      when 'PROSPECT' then 0 when 'CONTACT_ATTEMPTED' then 1 when 'CONNECTED' then 2
      when 'DECISION_MAKER_IDENTIFIED' then 3 when 'DECISION_MAKER_CONTACTED' then 4
      when 'QUALIFIED' then 5 when 'MEETING_TO_SCHEDULE' then 6 when 'MEETING_SCHEDULED' then 7
      when 'MEETING_COMPLETED' then 8 when 'PROPOSAL' then 9 when 'NEGOTIATION' then 10
      when 'WON' then 11 when 'LOST' then 12 else -1 end)
  then
    v_effective_stage := v_stage;
  end if;

  update public.sales_opportunities
  set pipeline_stage=v_effective_stage,
      stage=case
        when v_effective_stage='QUALIFIED' then 'qualified'
        when v_effective_stage in ('MEETING_TO_SCHEDULE','MEETING_SCHEDULED','MEETING_COMPLETED') then 'discovery'
        when v_effective_stage='PROPOSAL' then 'proposal'
        when v_effective_stage='NEGOTIATION' then 'negotiation'
        when v_effective_stage='WON' then 'won'
        when v_effective_stage='LOST' then 'lost'
        else stage
      end,
      primary_contact_id=coalesce(v_contact_id,primary_contact_id),
      next_action_type=coalesce(v_next_action_type,next_action_type),
      next_action_due_at=coalesce(v_next_action_at,next_action_due_at),
      updated_at=now()
  where id=v_opportunity_id and company_id=v_company_id;

  insert into public.crm_activities(
    company_id,contact_id,opportunity_id,activity_type,status,title,description,completed_at,metadata,external_id
  )
  values(
    v_company_id,v_contact_id,v_opportunity_id,'call','completed','Ligação · '||v_outcome,v_note,now(),
    jsonb_build_object('outcome',v_outcome,'call_attempt_id',v_attempt.id),v_external_id||':activity'
  )
  returning id into v_activity_id;

  if v_outcome='MEETING_BOOKED' then
    insert into public.meetings(
      company_id,opportunity_id,primary_contact_id,seller_id,meeting_status,meeting_type,mode,
      scheduled_at,duration_minutes,objective,notes,metadata,external_id
    )
    values(
      v_company_id,v_opportunity_id,v_contact_id,nullif(v_meeting->>'sellerId','')::uuid,
      'MEETING_SCHEDULED',nullif(v_meeting->>'type',''),v_meeting_mode,
      (v_meeting->>'scheduledAt')::timestamptz,v_meeting_duration,
      nullif(v_meeting->>'objective',''),nullif(v_meeting->>'notes',''),
      jsonb_build_object('source','dutra_os','call_attempt_id',v_attempt.id),v_external_id||':meeting'
    )
    returning id into v_meeting_id;
  end if;

  if v_member_id is not null then
    update public.lead_list_members
      set work_status='WORKED',last_attempt_at=now(),worked_at=now(),updated_at=now()
      where id=v_member_id and company_id=v_company_id;
  end if;

  if v_session_id is not null then
    select lm.id into v_next_member_id
    from public.lead_list_members lm
    join public.prospecting_sessions ps on ps.list_id=lm.list_id
    where ps.id=v_session_id
      and lm.work_status in ('AVAILABLE','IN_PROGRESS')
    order by lm.position asc nulls last,lm.created_at asc
    limit 1;

    update public.prospecting_sessions
      set current_member_id=v_next_member_id,updated_at=now()
      where id=v_session_id;
  end if;

  return jsonb_build_object(
    'duplicate',false,
    'callAttemptId',v_attempt.id,
    'activityId',v_activity_id,
    'opportunityId',v_opportunity_id,
    'meetingId',v_meeting_id,
    'pipelineStage',v_effective_stage,
    'nextMemberId',v_next_member_id
  );
end $$;

revoke all on function public.record_sales_execution_result_v1(jsonb) from public, anon, authenticated;
grant execute on function public.record_sales_execution_result_v1(jsonb) to service_role;
comment on function public.record_sales_execution_result_v1(jsonb) is
  'Atomic trusted-gateway command for confirmed Sales Execution call results; stage progression is monotonic except explicit LOST.';
