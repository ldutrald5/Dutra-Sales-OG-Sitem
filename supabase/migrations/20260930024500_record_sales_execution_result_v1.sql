-- Atomic Sales Execution command. Additive only.
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
  v_attempt public.call_attempts%rowtype;
  v_activity_id uuid;
  v_meeting_id uuid;
  v_next_member_id uuid;
  v_meeting jsonb := coalesce(p_command->'meeting','{}'::jsonb);
begin
  if v_external_id is null or v_company_id is null then raise exception 'externalId and companyId are required'; end if;
  if v_outcome not in ('NO_ANSWER','INVALID_NUMBER','GATEKEEPER','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_REACHED','RETURN_LATER','QUALIFIED','MEETING_BOOKED','SEND_MATERIAL','PROPOSAL','NOT_INTERESTED') then raise exception 'invalid call result'; end if;

  select * into v_attempt from public.call_attempts where external_id=v_external_id limit 1;
  if found then return jsonb_build_object('duplicate',true,'callAttemptId',v_attempt.id,'outcome',v_attempt.outcome); end if;

  v_stage := case v_outcome
    when 'NO_ANSWER' then 'CONTACT_ATTEMPTED' when 'INVALID_NUMBER' then 'CONTACT_ATTEMPTED'
    when 'GATEKEEPER' then 'CONNECTED' when 'DECISION_MAKER_IDENTIFIED' then 'DECISION_MAKER_IDENTIFIED'
    when 'DECISION_MAKER_REACHED' then 'DECISION_MAKER_CONTACTED' when 'RETURN_LATER' then 'CONNECTED'
    when 'QUALIFIED' then 'QUALIFIED' when 'MEETING_BOOKED' then 'MEETING_SCHEDULED'
    when 'SEND_MATERIAL' then 'CONNECTED' when 'PROPOSAL' then 'PROPOSAL'
    when 'NOT_INTERESTED' then 'LOST' end;

  insert into public.call_attempts(session_id,list_member_id,company_id,contact_id,ended_at,outcome,connected,decision_maker_reached,qualified,notes,metadata,external_id)
  values(v_session_id,v_member_id,v_company_id,v_contact_id,now(),v_outcome,
    v_outcome in ('GATEKEEPER','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','SEND_MATERIAL','PROPOSAL'),
    v_outcome in ('DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','PROPOSAL'),
    v_outcome in ('QUALIFIED','MEETING_BOOKED','PROPOSAL'),v_note,
    jsonb_build_object('source','dutra_os','command','record_sales_execution_result_v1'),v_external_id)
  returning * into v_attempt;

  if v_opportunity_id is not null then
    update public.sales_opportunities set pipeline_stage=v_stage,
      next_action_type=coalesce(v_next_action_type,next_action_type),
      next_action_due_at=coalesce(v_next_action_at,next_action_due_at),
      updated_at=now()
    where id=v_opportunity_id and company_id=v_company_id;
  end if;

  insert into public.crm_activities(company_id,contact_id,opportunity_id,activity_type,status,title,description,completed_at,metadata,external_id)
  values(v_company_id,v_contact_id,v_opportunity_id,'call','completed','Ligação · '||v_outcome,v_note,now(),
    jsonb_build_object('outcome',v_outcome,'call_attempt_id',v_attempt.id),v_external_id||':activity')
  returning id into v_activity_id;

  if v_outcome='MEETING_BOOKED' then
    if nullif(v_meeting->>'scheduledAt','') is null then raise exception 'meeting.scheduledAt required for MEETING_BOOKED'; end if;
    insert into public.meetings(company_id,opportunity_id,primary_contact_id,seller_id,meeting_status,meeting_type,mode,scheduled_at,duration_minutes,objective,notes,metadata,external_id)
    values(v_company_id,v_opportunity_id,v_contact_id,nullif(v_meeting->>'sellerId','')::uuid,'MEETING_SCHEDULED',
      nullif(v_meeting->>'type',''),coalesce(nullif(upper(v_meeting->>'mode'),''),'ONLINE'),
      (v_meeting->>'scheduledAt')::timestamptz,coalesce(nullif(v_meeting->>'durationMinutes','')::int,30),
      nullif(v_meeting->>'objective',''),nullif(v_meeting->>'notes',''),
      jsonb_build_object('source','dutra_os','call_attempt_id',v_attempt.id),v_external_id||':meeting')
    returning id into v_meeting_id;
  end if;

  if v_member_id is not null then
    update public.lead_list_members set work_status='WORKED',last_attempt_at=now(),worked_at=now(),updated_at=now()
    where id=v_member_id and company_id=v_company_id;
  end if;

  if v_session_id is not null then
    select lm.id into v_next_member_id
    from public.lead_list_members lm join public.prospecting_sessions ps on ps.list_id=lm.list_id
    where ps.id=v_session_id and lm.work_status in ('AVAILABLE','IN_PROGRESS')
    order by lm.position asc nulls last,lm.created_at asc limit 1;
    update public.prospecting_sessions set current_member_id=v_next_member_id,updated_at=now() where id=v_session_id;
  end if;

  return jsonb_build_object('duplicate',false,'callAttemptId',v_attempt.id,'activityId',v_activity_id,'meetingId',v_meeting_id,'pipelineStage',v_stage,'nextMemberId',v_next_member_id);
end $$;

revoke all on function public.record_sales_execution_result_v1(jsonb) from public, anon, authenticated;
grant execute on function public.record_sales_execution_result_v1(jsonb) to service_role;
comment on function public.record_sales_execution_result_v1(jsonb) is 'Atomic trusted-gateway command for confirmed Sales Execution call results.';
