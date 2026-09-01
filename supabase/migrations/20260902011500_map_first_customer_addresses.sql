-- Make map coordinates the required source of truth for customer request locations.
-- Reverse-geocoded text is descriptive only and can be unavailable without blocking a request.
create or replace function public.create_maintenance_request_atomic(
  service_code_input text,
  title_input text,
  description_input text,
  address_input jsonb,
  priority_input public.maintenance_request_priority default 'normal',
  pricing_mode_input public.maintenance_pricing_mode default 'offers',
  offered_price_input numeric default null,
  timing_mode_input text default 'asap',
  scheduled_date_input date default null,
  scheduled_time_input time without time zone default null,
  location_note_input text default null,
  contact_phone_input text default null,
  service_metadata_input jsonb default '{}'::jsonb,
  idempotency_key_input text default null
)
returns public.maintenance_requests
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid := auth.uid();
  catalog public.service_catalog;
  address_id uuid;
  created_request public.maintenance_requests;
  command_key text := nullif(btrim(idempotency_key_input), '');
  selected_latitude numeric := nullif(address_input->>'latitude', '')::numeric;
  selected_longitude numeric := nullif(address_input->>'longitude', '')::numeric;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  if char_length(btrim(coalesce(title_input, ''))) < 3 then raise exception 'invalid_title'; end if;
  if selected_latitude is null or selected_longitude is null
    or selected_latitude not between -90 and 90
    or selected_longitude not between -180 and 180 then
    raise exception 'map_location_required';
  end if;
  if timing_mode_input not in ('asap', 'scheduled') then raise exception 'invalid_timing_mode'; end if;
  if timing_mode_input = 'scheduled' and (scheduled_date_input is null or scheduled_time_input is null) then
    raise exception 'scheduled_time_required';
  end if;

  select * into catalog
  from public.service_catalog
  where code = service_code_input and is_active and customer_visible
  for share;
  if not found then raise exception 'service_unavailable'; end if;
  if pricing_mode_input = 'offers' and not catalog.supports_offers then raise exception 'offers_not_supported'; end if;
  if pricing_mode_input = 'price' and (not catalog.supports_fixed_price or coalesce(offered_price_input, 0) <= 0) then
    raise exception 'fixed_price_not_supported';
  end if;

  select * into created_request
  from public.maintenance_requests
  where user_id = actor and idempotency_key = command_key;
  if found then return created_request; end if;

  insert into public.customer_addresses (
    customer_id, label, city, district, street, building_no, unit_no, latitude, longitude
  ) values (
    actor,
    coalesce(nullif(btrim(address_input->>'label'), ''), 'موقع الطلب'),
    coalesce(nullif(btrim(address_input->>'city'), ''), 'موقع محدد على الخريطة'),
    coalesce(nullif(btrim(address_input->>'district'), ''), 'غير محدد'),
    nullif(btrim(address_input->>'street'), ''),
    nullif(btrim(address_input->>'building_no'), ''),
    nullif(btrim(address_input->>'unit_no'), ''),
    selected_latitude,
    selected_longitude
  ) returning id into address_id;

  insert into public.maintenance_requests (
    user_id, customer_address_id, title, description, category, service_code,
    workflow_type, after_service_policy, service_metadata, priority, pricing_mode,
    offered_price, service_timing_mode, scheduled_date, scheduled_time,
    location_note, contact_phone, idempotency_key
  ) values (
    actor, address_id, btrim(title_input), nullif(btrim(description_input), ''),
    catalog.legacy_category, catalog.code, catalog.workflow_type,
    catalog.after_service_policy, coalesce(service_metadata_input, '{}'::jsonb),
    priority_input, pricing_mode_input,
    case when pricing_mode_input = 'price' then offered_price_input else null end,
    timing_mode_input, scheduled_date_input, scheduled_time_input,
    nullif(btrim(location_note_input), ''), nullif(btrim(contact_phone_input), ''), command_key
  ) returning * into created_request;

  insert into public.maintenance_request_events (
    request_id, actor_id, event_type, to_status, payload, idempotency_key
  ) values (
    created_request.id, actor, 'request_created', 'new',
    jsonb_build_object(
      'source', 'direct',
      'service_code', catalog.code,
      'location_source', 'map',
      'latitude', selected_latitude,
      'longitude', selected_longitude
    ),
    command_key || ':created'
  );

  return created_request;
end;
$function$;

comment on function public.create_maintenance_request_atomic(
  text, text, text, jsonb, public.maintenance_request_priority,
  public.maintenance_pricing_mode, numeric, text, date,
  time without time zone, text, text, jsonb, text
) is 'Creates an idempotent customer request using map coordinates as the location source of truth.';
