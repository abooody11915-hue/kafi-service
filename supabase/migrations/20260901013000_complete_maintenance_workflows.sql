-- Complete the extracted KAFI 2 maintenance workflow with server-side commands.
-- No production users, providers, requests, or financial rows are copied.

alter table public.provider_offers
  add column if not exists quoted_at timestamptz;

create index if not exists provider_offers_request_quoted_idx
  on public.provider_offers(request_id, quoted_at desc)
  where status = 'pending' and quoted_at is not null;

create or replace function private.is_assigned_maintenance_provider(target_request uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.maintenance_requests request
    join public.maintenance_providers provider on provider.id = request.provider_id
    where request.id = target_request
      and provider.user_id = auth.uid()
      and provider.is_active
      and provider.verification_status = 'approved'
  );
$$;
revoke all on function private.is_assigned_maintenance_provider(uuid) from public, anon, authenticated;
grant execute on function private.is_assigned_maintenance_provider(uuid) to authenticated;

create or replace function private.dispatch_maintenance_request()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.provider_offers (
    request_id, provider_id, provider_user_id, offered_price, quoted_at, expires_at
  )
  select
    new.id,
    provider.id,
    provider.user_id,
    case when new.pricing_mode = 'price' then new.offered_price else null end,
    case when new.pricing_mode = 'price' then now() else null end,
    now() + interval '24 hours'
  from public.maintenance_providers provider
  join public.provider_service_catalog selection
    on selection.provider_id = provider.id
   and selection.service_code = new.service_code
   and selection.is_active
  where provider.is_active
    and provider.verification_status = 'approved'
  order by provider.rating desc nulls last, provider.created_at
  limit 12
  on conflict (request_id, provider_id) do nothing;
  return new;
end;
$$;
revoke all on function private.dispatch_maintenance_request() from public, anon, authenticated;

drop trigger if exists dispatch_new_maintenance_request on public.maintenance_requests;
create trigger dispatch_new_maintenance_request
  after insert on public.maintenance_requests
  for each row execute function private.dispatch_maintenance_request();

create or replace function public.get_provider_opportunities()
returns table(
  offer_id uuid,
  request_id uuid,
  ref_no bigint,
  service_code text,
  service_name_ar text,
  title text,
  description text,
  priority public.maintenance_request_priority,
  pricing_mode public.maintenance_pricing_mode,
  offered_price numeric,
  quoted_at timestamptz,
  offer_status public.provider_offer_status,
  city text,
  district text,
  timing_mode text,
  scheduled_date date,
  scheduled_time time,
  expires_at timestamptz,
  created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select offer.id, request.id, request.ref_no, request.service_code, catalog.name_ar,
         request.title, request.description, request.priority, request.pricing_mode,
         offer.offered_price, offer.quoted_at, offer.status,
         address.city, address.district, request.service_timing_mode,
         request.scheduled_date, request.scheduled_time, offer.expires_at, offer.created_at
  from public.provider_offers offer
  join public.maintenance_providers provider on provider.id = offer.provider_id
  join public.maintenance_requests request on request.id = offer.request_id
  join public.service_catalog catalog on catalog.code = request.service_code
  join public.customer_addresses address on address.id = request.customer_address_id
  where provider.user_id = auth.uid()
    and provider.is_active
    and provider.verification_status = 'approved'
  order by request.priority desc, offer.created_at desc;
$$;

create or replace function public.register_provider_document(
  doc_type_input public.provider_document_type,
  storage_path_input text
)
returns public.provider_documents
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  provider public.maintenance_providers;
  document public.provider_documents;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into provider from public.maintenance_providers where user_id = actor for update;
  if not found then raise exception 'provider_profile_required'; end if;
  if storage_path_input !~ ('^' || actor::text || '/(id_card|commercial_registration|bank_iban)/') then
    raise exception 'invalid_document_path';
  end if;

  insert into public.provider_documents(provider_user_id, doc_type, storage_path, status)
  values (actor, doc_type_input, storage_path_input, 'pending')
  on conflict (provider_user_id, doc_type) do update
    set storage_path = excluded.storage_path,
        status = 'pending', review_notes = null, reviewed_at = null,
        reviewed_by = null, updated_at = now()
  returning * into document;

  update public.maintenance_providers
  set verification_status = case when verification_status = 'rejected' then 'needs_completion' else verification_status end,
      updated_at = now()
  where id = provider.id;
  return document;
end;
$$;

create or replace function public.submit_provider_verification()
returns public.maintenance_providers
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  provider public.maintenance_providers;
  required_count integer;
  valid_count integer;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into provider from public.maintenance_providers where user_id = actor for update;
  if not found then raise exception 'provider_profile_required'; end if;
  required_count := case when provider.business_kind = 'company' then 3 else 2 end;
  select count(*) into valid_count
  from public.provider_documents document
  where document.provider_user_id = actor
    and document.doc_type in ('id_card','bank_iban','commercial_registration')
    and (provider.business_kind = 'company' or document.doc_type <> 'commercial_registration');
  if valid_count < required_count then raise exception 'required_documents_missing'; end if;
  if nullif(btrim(coalesce(provider.iban,'')), '') is null then raise exception 'iban_required'; end if;

  update public.maintenance_providers
  set verification_status = 'under_review', is_active = false,
      verification_notes = null, updated_at = now()
  where id = provider.id returning * into provider;
  return provider;
end;
$$;

create or replace function public.review_maintenance_provider(
  provider_id_input uuid,
  decision_input public.provider_verification_status,
  notes_input text default null
)
returns public.maintenance_providers
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  provider public.maintenance_providers;
begin
  if actor is null or not private.is_platform_member(array['platform_owner','compliance_reviewer']::public.platform_role[]) then
    raise exception 'forbidden';
  end if;
  if decision_input not in ('approved','rejected','needs_completion','suspended') then
    raise exception 'invalid_decision';
  end if;
  if decision_input in ('rejected','needs_completion','suspended') and nullif(btrim(coalesce(notes_input,'')), '') is null then
    raise exception 'review_notes_required';
  end if;

  update public.maintenance_providers
  set verification_status = decision_input,
      verification_notes = nullif(btrim(notes_input),''),
      verified_at = case when decision_input = 'approved' then now() else null end,
      verified_by = actor,
      is_active = decision_input = 'approved',
      updated_at = now()
  where id = provider_id_input
  returning * into provider;
  if not found then raise exception 'provider_not_found'; end if;

  update public.provider_documents
  set status = case when decision_input = 'approved' then 'approved'::public.provider_document_status else status end,
      review_notes = nullif(btrim(notes_input),''), reviewed_at = now(), reviewed_by = actor, updated_at = now()
  where provider_user_id = provider.user_id;
  return provider;
end;
$$;

create or replace function public.respond_to_provider_offer(
  offer_id_input uuid,
  response_input text,
  offered_price_input numeric default null,
  notes_input text default null
)
returns public.provider_offers
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  offer public.provider_offers;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into offer from public.provider_offers where id = offer_id_input for update;
  if not found or offer.provider_user_id <> actor then raise exception 'offer_not_found'; end if;
  if offer.status <> 'pending' or (offer.expires_at is not null and offer.expires_at <= now()) then
    raise exception 'offer_unavailable';
  end if;
  if response_input = 'decline' then
    update public.provider_offers set status = 'declined', responded_at = now(), notes = nullif(btrim(notes_input),''), updated_at = now()
    where id = offer.id returning * into offer;
  elsif response_input = 'quote' then
    if coalesce(offered_price_input,0) <= 0 then raise exception 'valid_price_required'; end if;
    update public.provider_offers set offered_price = offered_price_input, quoted_at = now(), notes = nullif(btrim(notes_input),''), updated_at = now()
    where id = offer.id returning * into offer;
  else
    raise exception 'invalid_response';
  end if;
  return offer;
end;
$$;

create or replace function public.accept_provider_offer(
  offer_id_input uuid,
  idempotency_key_input text
)
returns public.maintenance_requests
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  offer public.provider_offers;
  request public.maintenance_requests;
  command_key text := nullif(btrim(idempotency_key_input),'');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  select * into offer from public.provider_offers where id = offer_id_input for update;
  if not found or offer.status <> 'pending' or offer.quoted_at is null or offer.offered_price is null then raise exception 'offer_unavailable'; end if;
  if offer.expires_at is not null and offer.expires_at <= now() then raise exception 'offer_expired'; end if;
  select * into request from public.maintenance_requests where id = offer.request_id for update;
  if request.user_id <> actor then raise exception 'forbidden'; end if;
  if request.status <> 'new' then return request; end if;

  update public.provider_offers set status = 'accepted', responded_at = now(), updated_at = now() where id = offer.id;
  update public.provider_offers set status = 'declined', responded_at = now(), updated_at = now()
    where request_id = request.id and id <> offer.id and status = 'pending';
  update public.maintenance_requests
  set provider_id = offer.provider_id, offered_price = offer.offered_price,
      status = 'accepted', last_activity_at = now(), updated_at = now()
  where id = request.id returning * into request;
  insert into public.maintenance_request_events(request_id,actor_id,event_type,from_status,to_status,payload,idempotency_key)
  values(request.id,actor,'offer_accepted','new','accepted',jsonb_build_object('offer_id',offer.id,'provider_id',offer.provider_id,'price',offer.offered_price),command_key)
  on conflict (request_id,idempotency_key) do nothing;
  return request;
end;
$$;

create or replace function public.transition_maintenance_request(
  request_id_input uuid,
  expected_status_input public.maintenance_status,
  target_status_input public.maintenance_status,
  idempotency_key_input text,
  payload_input jsonb default '{}'::jsonb
)
returns public.maintenance_requests
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request public.maintenance_requests;
  allowed boolean := false;
  command_key text := nullif(btrim(idempotency_key_input),'');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  select * into request from public.maintenance_requests where id = request_id_input for update;
  if not found then raise exception 'request_not_found'; end if;
  if request.status = target_status_input then return request; end if;
  if request.status <> expected_status_input then raise exception 'stale_request_state'; end if;

  if private.is_assigned_maintenance_provider(request.id) then
    allowed := (request.status, target_status_input) in (
      ('accepted','arrived'), ('arrived','in_progress'),
      ('in_progress','waiting_confirmation'),
      ('warranty_requested','warranty_in_progress'),
      ('warranty_in_progress','warranty_waiting_confirmation')
    );
  elsif request.user_id = actor then
    allowed := (request.status = 'new' and target_status_input = 'cancelled')
      or (request.status = 'warranty_waiting_confirmation' and target_status_input = 'warranty_resolved');
  elsif private.is_platform_member(null) then
    allowed := true;
  end if;
  if not allowed then raise exception 'transition_not_allowed'; end if;

  update public.maintenance_requests
  set status = target_status_input,
      arrived_at = case when target_status_input = 'arrived' then now() else arrived_at end,
      work_started_at = case when target_status_input in ('in_progress','warranty_in_progress') then now() else work_started_at end,
      work_completed_at = case when target_status_input in ('waiting_confirmation','warranty_waiting_confirmation') then now() else work_completed_at end,
      warranty_resolved_at = case when target_status_input = 'warranty_resolved' then now() else warranty_resolved_at end,
      last_activity_at = now(), updated_at = now()
  where id = request.id returning * into request;
  insert into public.maintenance_request_events(request_id,actor_id,event_type,from_status,to_status,payload,idempotency_key)
  values(request.id,actor,'status_changed',expected_status_input,target_status_input,coalesce(payload_input,'{}'::jsonb),command_key)
  on conflict (request_id,idempotency_key) do nothing;
  return request;
end;
$$;

create or replace function public.confirm_maintenance_work(
  request_id_input uuid,
  idempotency_key_input text
)
returns public.provider_invoices
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid(); request public.maintenance_requests; provider public.maintenance_providers;
  invoice public.provider_invoices; base numeric(12,2); vat numeric(12,2); fee numeric(12,2);
begin
  select * into request from public.maintenance_requests where id = request_id_input for update;
  if not found or request.user_id <> actor then raise exception 'request_not_found'; end if;
  if request.status not in ('waiting_confirmation','waiting_payment') then raise exception 'request_not_ready'; end if;
  if request.offered_price is null or request.provider_id is null then raise exception 'price_or_provider_missing'; end if;
  select * into provider from public.maintenance_providers where id = request.provider_id;
  select * into invoice from public.provider_invoices where request_id = request.id;
  if found then return invoice; end if;
  base := request.offered_price; vat := round(base * 0.15, 2); fee := round(base * 0.10, 2);
  insert into public.provider_invoices(request_id,provider_id,provider_user_id,user_id,amount,base_amount,vat_amount,platform_fee_amount,provider_amount,description)
  values(request.id,provider.id,provider.user_id,actor,base + vat,base,vat,fee,base + vat - fee,'فاتورة خدمة رقم ' || request.ref_no)
  returning * into invoice;
  update public.maintenance_requests set status = 'waiting_payment', last_activity_at = now(), updated_at = now() where id = request.id;
  insert into public.maintenance_request_events(request_id,actor_id,event_type,from_status,to_status,payload,idempotency_key)
  values(request.id,actor,'work_confirmed','waiting_confirmation','waiting_payment',jsonb_build_object('invoice_id',invoice.id),idempotency_key_input)
  on conflict (request_id,idempotency_key) do nothing;
  return invoice;
end;
$$;

create or replace function public.submit_maintenance_payment(
  invoice_id_input uuid,
  payment_method_input text default 'cash'
)
returns public.provider_invoices
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); invoice public.provider_invoices;
begin
  select * into invoice from public.provider_invoices where id = invoice_id_input for update;
  if not found or invoice.user_id <> actor then raise exception 'invoice_not_found'; end if;
  if invoice.status = 'payment_submitted' then return invoice; end if;
  if invoice.status <> 'pending_payment' then raise exception 'invoice_not_payable'; end if;
  update public.provider_invoices set status='payment_submitted', payment_method=nullif(btrim(payment_method_input),''), user_paid_at=now(), updated_at=now()
  where id=invoice.id returning * into invoice;
  return invoice;
end;
$$;

create or replace function public.confirm_maintenance_payment(invoice_id_input uuid)
returns public.provider_invoices
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); invoice public.provider_invoices; provider public.maintenance_providers; request public.maintenance_requests;
begin
  select * into invoice from public.provider_invoices where id = invoice_id_input for update;
  if not found then raise exception 'invoice_not_found'; end if;
  select * into provider from public.maintenance_providers where id = invoice.provider_id;
  if provider.user_id <> actor and not private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]) then raise exception 'forbidden'; end if;
  if invoice.status = 'paid' then return invoice; end if;
  if invoice.status <> 'payment_submitted' then raise exception 'payment_not_submitted'; end if;
  update public.provider_invoices set status='paid',provider_confirmed_at=now(),payment_confirmed=true,provider_received=true,updated_at=now()
  where id=invoice.id returning * into invoice;
  insert into public.provider_transactions(request_id,invoice_id,provider_id,provider_user_id,total_amount,platform_fee_percent,platform_fee,provider_amount,settlement_direction)
  values(invoice.request_id,invoice.id,invoice.provider_id,invoice.provider_user_id,invoice.amount,invoice.platform_fee_percent,invoice.platform_fee_amount,invoice.provider_amount,invoice.settlement_direction)
  on conflict (invoice_id) do nothing;
  update public.maintenance_requests set status='completed',original_completed_at=coalesce(original_completed_at,now()),last_activity_at=now(),updated_at=now()
  where id=invoice.request_id returning * into request;
  insert into public.maintenance_request_events(request_id,actor_id,event_type,from_status,to_status,payload,idempotency_key)
  values(request.id,actor,'payment_confirmed','waiting_payment','completed',jsonb_build_object('invoice_id',invoice.id),'payment:'||invoice.id::text)
  on conflict (request_id,idempotency_key) do nothing;
  return invoice;
end;
$$;

create or replace function public.open_maintenance_warranty(
  request_id_input uuid,
  reason_input text,
  idempotency_key_input text
)
returns public.maintenance_requests
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); request public.maintenance_requests; warranty_days integer;
begin
  select * into request from public.maintenance_requests where id=request_id_input for update;
  if not found or request.user_id <> actor then raise exception 'request_not_found'; end if;
  if request.status <> 'completed' or request.after_service_policy not in ('warranty','quality_claim','redelivery') then raise exception 'warranty_not_available'; end if;
  warranty_days := case request.after_service_policy when 'warranty' then 30 when 'quality_claim' then 3 when 'redelivery' then 1 else 0 end;
  if coalesce(request.original_completed_at,request.updated_at) + make_interval(days => warranty_days) < now() then raise exception 'warranty_expired'; end if;
  if char_length(btrim(coalesce(reason_input,''))) < 5 then raise exception 'warranty_reason_required'; end if;
  update public.maintenance_requests set status='warranty_requested',warranty_opened_at=now(),warranty_reason=btrim(reason_input),warranty_count=warranty_count+1,last_activity_at=now(),updated_at=now()
  where id=request.id returning * into request;
  insert into public.maintenance_request_events(request_id,actor_id,event_type,from_status,to_status,payload,idempotency_key)
  values(request.id,actor,'warranty_opened','completed','warranty_requested',jsonb_build_object('reason',btrim(reason_input)),idempotency_key_input)
  on conflict (request_id,idempotency_key) do nothing;
  return request;
end;
$$;

create or replace function public.create_provider_settlement()
returns public.provider_settlements
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); provider public.maintenance_providers; settlement public.provider_settlements; amount numeric; item_count integer;
begin
  select * into provider from public.maintenance_providers where user_id=actor and is_active for update;
  if not found then raise exception 'active_provider_required'; end if;
  select coalesce(sum(platform_fee),0),count(*) into amount,item_count
  from public.provider_transactions where provider_id=provider.id and status='pending' and settlement_id is null and settlement_direction='provider_to_platform';
  if item_count=0 then raise exception 'no_unsettled_transactions'; end if;
  insert into public.provider_settlements(provider_id,provider_user_id,total_amount,transactions_count,period_from,period_to,initiator,settlement_direction)
  select provider.id,actor,amount,item_count,min(created_at),max(created_at),'provider','provider_to_platform'
  from public.provider_transactions where provider_id=provider.id and status='pending' and settlement_id is null
  returning * into settlement;
  update public.provider_transactions set settlement_id=settlement.id,updated_at=now()
  where provider_id=provider.id and status='pending' and settlement_id is null;
  insert into public.settlement_state_transitions(settlement_id,to_state,actor_user_id,reason)
  values(settlement.id,'pending_payment',actor,'provider_created');
  return settlement;
end;
$$;

create or replace function public.submit_provider_settlement_receipt(settlement_id_input uuid, receipt_path_input text)
returns public.provider_settlements
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); settlement public.provider_settlements;
begin
  select * into settlement from public.provider_settlements where id=settlement_id_input for update;
  if not found or settlement.provider_user_id <> actor then raise exception 'settlement_not_found'; end if;
  if settlement.status <> 'pending_payment' then raise exception 'settlement_not_payable'; end if;
  update public.provider_settlements set status='payment_submitted',receipt_storage_path=receipt_path_input,submitted_at=now(),updated_at=now()
  where id=settlement.id returning * into settlement;
  insert into public.settlement_state_transitions(settlement_id,from_state,to_state,actor_user_id,reason)
  values(settlement.id,'pending_payment','payment_submitted',actor,'receipt_submitted');
  return settlement;
end;
$$;

create or replace function public.confirm_provider_settlement(settlement_id_input uuid, notes_input text default null)
returns public.provider_settlements
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); settlement public.provider_settlements;
begin
  if actor is null or not private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]) then raise exception 'forbidden'; end if;
  select * into settlement from public.provider_settlements where id=settlement_id_input for update;
  if not found then raise exception 'settlement_not_found'; end if;
  if settlement.status='confirmed' then return settlement; end if;
  if settlement.status <> 'payment_submitted' then raise exception 'settlement_not_submitted'; end if;
  update public.provider_settlements set status='confirmed',owner_notes=nullif(btrim(notes_input),''),confirmed_at=now(),confirmed_by=actor,updated_at=now()
  where id=settlement.id returning * into settlement;
  update public.provider_transactions set status='paid',paid_at=now(),updated_at=now() where settlement_id=settlement.id;
  insert into public.settlement_state_transitions(settlement_id,from_state,to_state,actor_user_id,reason)
  values(settlement.id,'payment_submitted','confirmed',actor,'finance_confirmed');
  return settlement;
end;
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('provider-documents','provider-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy provider_documents_upload_own on storage.objects for insert to authenticated
with check(bucket_id='provider-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy provider_documents_update_own on storage.objects for update to authenticated
using(bucket_id='provider-documents' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check(bucket_id='provider-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy provider_documents_read_scoped on storage.objects for select to authenticated
using(bucket_id='provider-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_platform_member(array['platform_owner','compliance_reviewer']::public.platform_role[]))));
create policy provider_documents_delete_own on storage.objects for delete to authenticated
using(bucket_id='provider-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);

grant execute on function public.get_provider_opportunities() to authenticated;
grant execute on function public.register_provider_document(public.provider_document_type,text) to authenticated;
grant execute on function public.submit_provider_verification() to authenticated;
grant execute on function public.review_maintenance_provider(uuid,public.provider_verification_status,text) to authenticated;
grant execute on function public.respond_to_provider_offer(uuid,text,numeric,text) to authenticated;
grant execute on function public.accept_provider_offer(uuid,text) to authenticated;
grant execute on function public.transition_maintenance_request(uuid,public.maintenance_status,public.maintenance_status,text,jsonb) to authenticated;
grant execute on function public.confirm_maintenance_work(uuid,text) to authenticated;
grant execute on function public.submit_maintenance_payment(uuid,text) to authenticated;
grant execute on function public.confirm_maintenance_payment(uuid) to authenticated;
grant execute on function public.open_maintenance_warranty(uuid,text,text) to authenticated;
grant execute on function public.create_provider_settlement() to authenticated;
grant execute on function public.submit_provider_settlement_receipt(uuid,text) to authenticated;
grant execute on function public.confirm_provider_settlement(uuid,text) to authenticated;

alter publication supabase_realtime add table public.provider_documents;
alter publication supabase_realtime add table public.provider_settlements;
