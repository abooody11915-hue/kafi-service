-- Customer self-service commands. All writes remain atomic and auditable.

create or replace function public.cancel_maintenance_request(
  request_id_input uuid,
  reason_input text,
  idempotency_key_input text
)
returns public.maintenance_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request public.maintenance_requests;
  command_key text := nullif(btrim(idempotency_key_input), '');
  reason text := nullif(btrim(reason_input), '');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  if reason is null or char_length(reason) < 3 or char_length(reason) > 500 then
    raise exception 'valid_cancellation_reason_required';
  end if;

  select * into request
  from public.maintenance_requests
  where id = request_id_input
  for update;

  if not found then raise exception 'request_not_found'; end if;
  if request.user_id <> actor then raise exception 'forbidden'; end if;
  if request.status = 'cancelled' then return request; end if;
  if request.status <> 'new' then raise exception 'cancellation_requires_support'; end if;

  update public.maintenance_requests
  set status = 'cancelled', last_activity_at = now(), updated_at = now()
  where id = request.id
  returning * into request;

  update public.provider_offers
  set status = 'expired', updated_at = now()
  where request_id = request.id and status = 'pending';

  insert into public.maintenance_request_events(
    request_id, actor_id, event_type, from_status, to_status, payload, idempotency_key
  ) values (
    request.id, actor, 'customer_cancelled', 'new', 'cancelled',
    jsonb_build_object('reason', reason), command_key
  ) on conflict (request_id, idempotency_key) do nothing;

  return request;
end;
$$;

create or replace function public.reschedule_maintenance_request(
  request_id_input uuid,
  scheduled_date_input date,
  scheduled_time_input time,
  reason_input text,
  idempotency_key_input text
)
returns public.maintenance_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request public.maintenance_requests;
  command_key text := nullif(btrim(idempotency_key_input), '');
  reason text := nullif(btrim(reason_input), '');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  if scheduled_date_input is null or scheduled_time_input is null then
    raise exception 'schedule_required';
  end if;
  if scheduled_date_input < (now() at time zone 'Asia/Riyadh')::date then
    raise exception 'schedule_must_be_future';
  end if;
  if reason is not null and char_length(reason) > 500 then
    raise exception 'reason_too_long';
  end if;

  select * into request
  from public.maintenance_requests
  where id = request_id_input
  for update;

  if not found then raise exception 'request_not_found'; end if;
  if request.user_id <> actor then raise exception 'forbidden'; end if;
  if request.status not in ('new', 'accepted') then
    raise exception 'reschedule_not_allowed';
  end if;

  update public.maintenance_requests
  set service_timing_mode = 'scheduled',
      scheduled_date = scheduled_date_input,
      scheduled_time = scheduled_time_input,
      appointment_status = case when request.status = 'accepted' then 'reschedule_requested' else 'scheduled' end,
      last_activity_at = now(),
      updated_at = now()
  where id = request.id
  returning * into request;

  insert into public.maintenance_request_events(
    request_id, actor_id, event_type, from_status, to_status, payload, idempotency_key
  ) values (
    request.id, actor, 'customer_rescheduled', request.status, request.status,
    jsonb_build_object(
      'scheduled_date', scheduled_date_input,
      'scheduled_time', scheduled_time_input,
      'reason', reason
    ), command_key
  ) on conflict (request_id, idempotency_key) do nothing;

  return request;
end;
$$;

revoke execute on function public.cancel_maintenance_request(uuid, text, text) from public, anon;
revoke execute on function public.reschedule_maintenance_request(uuid, date, time, text, text) from public, anon;
grant execute on function public.cancel_maintenance_request(uuid, text, text) to authenticated;
grant execute on function public.reschedule_maintenance_request(uuid, date, time, text, text) to authenticated;
