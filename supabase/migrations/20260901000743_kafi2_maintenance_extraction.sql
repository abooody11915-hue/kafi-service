-- KAFI Service: extract the proven KAFI 2 maintenance domain without copying data.
-- Building/unit ownership is optional here; direct customers use a first-class address.

do $$ begin create type public.maintenance_category as enum
  ('plumbing','electrical','general','elevator','cleaning','other','hvac');
exception when duplicate_object then null; end $$;
do $$ begin create type public.maintenance_status as enum
  ('new','in_progress','completed','cancelled','waiting_confirmation','waiting_payment',
   'inactive','accepted','arrived','warranty_requested','warranty_in_progress',
   'warranty_waiting_confirmation','warranty_resolved','warranty_rejected');
exception when duplicate_object then null; end $$;
do $$ begin create type public.maintenance_type as enum ('building','unit');
exception when duplicate_object then null; end $$;
do $$ begin create type public.maintenance_pricing_mode as enum ('price','offers');
exception when duplicate_object then null; end $$;
do $$ begin create type public.maintenance_request_priority as enum ('normal','urgent','emergency');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_business_type as enum ('company','individual');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_verification_status as enum
  ('pending','approved','rejected','under_review','suspended','needs_completion');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_document_type as enum
  ('id_card','commercial_registration','bank_iban');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_document_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_offer_status as enum ('pending','accepted','declined','expired');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_invoice_status as enum
  ('pending_payment','payment_submitted','paid','cancelled','disputed','auto_confirmed');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_transaction_status as enum ('pending','paid');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_settlement_status as enum
  ('pending_payment','payment_submitted','confirmed','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_settlement_initiator as enum ('provider','owner');
exception when duplicate_object then null; end $$;

create table public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,50}$'),
  family_code text not null check (family_code in ('repair','cleaning','installation','moving','delivery','general')),
  name_ar text not null,
  description_ar text,
  legacy_category public.maintenance_category not null,
  workflow_type text not null default 'repair' check (workflow_type in ('repair','cleaning','delivery','moving','installation','general')),
  after_service_policy text not null default 'warranty' check (after_service_policy in ('warranty','quality_claim','redelivery','none')),
  supports_offers boolean not null default true,
  supports_fixed_price boolean not null default true,
  is_active boolean not null default true,
  customer_visible boolean not null default true,
  provider_selectable boolean not null default true,
  sort_order integer not null default 100,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  category public.maintenance_category not null default 'general',
  business_kind public.provider_business_type not null default 'individual',
  verification_status public.provider_verification_status not null default 'pending',
  verification_notes text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  rating numeric(2,1) check (rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  estimated_price numeric(12,2) not null default 0 check (estimated_price >= 0),
  response_time text not null default '24 ساعة',
  avatar_url text,
  is_active boolean not null default false,
  lat double precision,
  lng double precision,
  service_radius_km numeric(7,2) not null default 10 check (service_radius_km > 0),
  debt_limit numeric(12,2) check (debt_limit is null or debt_limit >= 0),
  iban text,
  bank_name text,
  account_holder text,
  vat_registration_number text,
  spoken_languages text[] not null default array['ar']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_service_catalog (
  provider_id uuid not null references public.maintenance_providers(id) on delete cascade,
  service_code text not null references public.service_catalog(code) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (provider_id, service_code)
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  ref_no bigint generated always as identity unique,
  user_id uuid not null references auth.users(id),
  customer_address_id uuid not null references public.customer_addresses(id),
  partner_id uuid references public.partners(id),
  partner_external_ref text,
  source text not null default 'direct' check (source in ('direct','partner')),
  building_id uuid,
  tenant_id uuid,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text,
  category public.maintenance_category not null default 'general',
  service_code text not null references public.service_catalog(code),
  workflow_type text not null check (workflow_type in ('repair','cleaning','delivery','moving','installation','general')),
  after_service_policy text not null check (after_service_policy in ('warranty','quality_claim','redelivery','none')),
  service_metadata jsonb not null default '{}'::jsonb,
  status public.maintenance_status not null default 'new',
  type public.maintenance_type not null default 'unit',
  provider_id uuid references public.maintenance_providers(id),
  priority public.maintenance_request_priority not null default 'normal',
  pricing_mode public.maintenance_pricing_mode not null default 'offers',
  offered_price numeric(12,2) check (offered_price is null or offered_price > 0),
  service_timing_mode text not null default 'asap' check (service_timing_mode in ('asap','scheduled')),
  scheduled_date date,
  scheduled_time time,
  appointment_status text not null default 'not_required',
  location_note text,
  apartment_number text,
  floor text,
  contact_phone text,
  request_lat double precision,
  request_lng double precision,
  manager_notes text,
  idempotency_key text not null,
  last_activity_at timestamptz not null default now(),
  expired_at timestamptz,
  repost_count integer not null default 0,
  ai_generated boolean not null default false,
  ai_summary text,
  ai_price_min numeric(12,2),
  ai_price_max numeric(12,2),
  ai_suggestions jsonb not null default '[]'::jsonb,
  en_route_at timestamptz,
  arrived_at timestamptz,
  work_started_at timestamptz,
  work_completed_at timestamptz,
  original_completed_at timestamptz,
  warranty_opened_at timestamptz,
  warranty_reason text,
  warranty_resolved_at timestamptz,
  warranty_rejected_at timestamptz,
  warranty_rejection_reason text,
  warranty_count integer not null default 0,
  completion_rework_count integer not null default 0,
  rating smallint check (rating between 1 and 5),
  rating_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check ((source = 'direct' and partner_id is null) or (source = 'partner' and partner_id is not null)),
  check ((service_timing_mode = 'asap') or (scheduled_date is not null and scheduled_time is not null))
);

create table public.maintenance_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  from_status public.maintenance_status,
  to_status public.maintenance_status,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (request_id, idempotency_key)
);

create table public.maintenance_request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  media_kind text not null check (media_kind in ('image','video','audio')),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 1 and 20971520),
  caption text,
  created_at timestamptz not null default now()
);

create table public.provider_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  provider_id uuid not null references public.maintenance_providers(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id),
  status public.provider_offer_status not null default 'pending',
  offered_price numeric(12,2) check (offered_price is null or offered_price > 0),
  notes text,
  distance_km numeric(8,2),
  expires_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, provider_id)
);

create table public.provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  doc_type public.provider_document_type not null,
  storage_path text not null,
  status public.provider_document_status not null default 'pending',
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_user_id, doc_type)
);

create table public.provider_invoices (
  id uuid primary key default gen_random_uuid(),
  ref_no bigint generated always as identity unique,
  request_id uuid not null unique references public.maintenance_requests(id),
  provider_id uuid not null references public.maintenance_providers(id),
  provider_user_id uuid not null references auth.users(id),
  user_id uuid not null references auth.users(id),
  amount numeric(12,2) not null check (amount > 0),
  base_amount numeric(12,2) not null check (base_amount >= 0),
  vat_percent numeric(5,2) not null default 15 check (vat_percent between 0 and 100),
  vat_amount numeric(12,2) not null default 0 check (vat_amount >= 0),
  platform_fee_percent numeric(5,2) not null default 10 check (platform_fee_percent between 0 and 100),
  platform_fee_amount numeric(12,2) not null default 0 check (platform_fee_amount >= 0),
  provider_amount numeric(12,2) not null default 0 check (provider_amount >= 0),
  description text,
  status public.provider_invoice_status not null default 'pending_payment',
  payment_method text,
  receipt_storage_path text,
  completion_proof_storage_path text,
  settlement_direction text not null default 'provider_to_platform' check (settlement_direction in ('provider_to_platform','platform_to_provider')),
  user_paid_at timestamptz,
  provider_confirmed_at timestamptz,
  disputed_at timestamptz,
  dispute_reason text,
  payment_confirmed boolean not null default false,
  provider_received boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount = base_amount + vat_amount)
);

create table public.provider_transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.maintenance_requests(id),
  invoice_id uuid not null unique references public.provider_invoices(id),
  provider_id uuid not null references public.maintenance_providers(id),
  provider_user_id uuid not null references auth.users(id),
  total_amount numeric(12,2) not null check (total_amount > 0),
  platform_fee_percent numeric(5,2) not null check (platform_fee_percent between 0 and 100),
  platform_fee numeric(12,2) not null check (platform_fee >= 0),
  provider_amount numeric(12,2) not null check (provider_amount >= 0),
  status public.provider_transaction_status not null default 'pending',
  settlement_id uuid,
  settlement_direction text not null default 'provider_to_platform' check (settlement_direction in ('provider_to_platform','platform_to_provider')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_amount = platform_fee + provider_amount)
);

create table public.provider_settlements (
  id uuid primary key default gen_random_uuid(),
  ref_no bigint generated always as identity unique,
  provider_id uuid not null references public.maintenance_providers(id),
  provider_user_id uuid not null references auth.users(id),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  transactions_count integer not null default 0 check (transactions_count >= 0),
  period_from timestamptz,
  period_to timestamptz,
  status public.provider_settlement_status not null default 'pending_payment',
  initiator public.provider_settlement_initiator not null default 'provider',
  settlement_direction text not null default 'provider_to_platform' check (settlement_direction in ('provider_to_platform','platform_to_provider')),
  receipt_storage_path text,
  notes text,
  owner_notes text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_transactions
  add constraint provider_transactions_settlement_fk
  foreign key (settlement_id) references public.provider_settlements(id);

create table public.settlement_state_transitions (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid references public.provider_settlements(id) on delete cascade,
  transaction_id uuid references public.provider_transactions(id) on delete cascade,
  from_state text,
  to_state text not null,
  actor_user_id uuid references auth.users(id),
  reason text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check ((settlement_id is not null)::integer + (transaction_id is not null)::integer = 1)
);

create index maintenance_requests_customer_created_idx on public.maintenance_requests(user_id, created_at desc);
create unique index maintenance_requests_partner_ref_unique
  on public.maintenance_requests(partner_id, partner_external_ref)
  where partner_id is not null and partner_external_ref is not null;
create index maintenance_requests_status_created_idx on public.maintenance_requests(status, created_at desc);
create index maintenance_requests_provider_status_idx on public.maintenance_requests(provider_id, status) where provider_id is not null;
create index maintenance_requests_service_status_idx on public.maintenance_requests(service_code, status, created_at desc);
create index maintenance_request_events_request_idx on public.maintenance_request_events(request_id, created_at);
create index maintenance_request_media_request_idx on public.maintenance_request_media(request_id, created_at);
create index provider_offers_provider_status_idx on public.provider_offers(provider_id, status, created_at desc);
create index provider_documents_status_idx on public.provider_documents(status, created_at);
create index provider_transactions_provider_status_idx on public.provider_transactions(provider_id, status, created_at);
create index provider_settlements_provider_status_idx on public.provider_settlements(provider_id, status, created_at desc);
create index provider_service_catalog_service_idx on public.provider_service_catalog(service_code) where is_active;

create or replace function public.get_customer_service_catalog()
returns table(
  code text, family_code text, name_ar text, description_ar text,
  legacy_category public.maintenance_category, workflow_type text,
  after_service_policy text, supports_offers boolean,
  supports_fixed_price boolean, sort_order integer
)
language sql stable security definer set search_path = ''
as $$
  select catalog.code, catalog.family_code, catalog.name_ar, catalog.description_ar,
         catalog.legacy_category, catalog.workflow_type, catalog.after_service_policy,
         catalog.supports_offers, catalog.supports_fixed_price, catalog.sort_order
  from public.service_catalog catalog
  where catalog.is_active and catalog.customer_visible
  order by catalog.sort_order, catalog.code;
$$;

create or replace function public.get_service_provider_availability()
returns table(service_code text, provider_count integer)
language sql stable security definer set search_path = ''
as $$
  select catalog.code,
         count(distinct provider.id) filter (
           where provider.is_active and provider.verification_status = 'approved'
         )::integer
  from public.service_catalog catalog
  left join public.provider_service_catalog selection
    on selection.service_code = catalog.code and selection.is_active
  left join public.maintenance_providers provider on provider.id = selection.provider_id
  where catalog.is_active and catalog.customer_visible
  group by catalog.code;
$$;

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
  scheduled_time_input time default null,
  location_note_input text default null,
  contact_phone_input text default null,
  service_metadata_input jsonb default '{}'::jsonb,
  idempotency_key_input text default null
)
returns public.maintenance_requests
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  catalog public.service_catalog;
  address_id uuid;
  created_request public.maintenance_requests;
  command_key text := nullif(btrim(idempotency_key_input), '');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if command_key is null then raise exception 'idempotency_key_required'; end if;
  if char_length(btrim(coalesce(title_input,''))) < 3 then raise exception 'invalid_title'; end if;
  if coalesce(address_input->>'city','') = '' or coalesce(address_input->>'district','') = '' then
    raise exception 'address_required';
  end if;
  if timing_mode_input not in ('asap','scheduled') then raise exception 'invalid_timing_mode'; end if;
  if timing_mode_input = 'scheduled' and (scheduled_date_input is null or scheduled_time_input is null) then
    raise exception 'scheduled_time_required';
  end if;

  select * into catalog from public.service_catalog
  where code = service_code_input and is_active and customer_visible
  for share;
  if not found then raise exception 'service_unavailable'; end if;
  if pricing_mode_input = 'offers' and not catalog.supports_offers then raise exception 'offers_not_supported'; end if;
  if pricing_mode_input = 'price' and (not catalog.supports_fixed_price or coalesce(offered_price_input,0) <= 0) then
    raise exception 'fixed_price_not_supported';
  end if;

  select * into created_request from public.maintenance_requests
  where user_id = actor and idempotency_key = command_key;
  if found then return created_request; end if;

  insert into public.customer_addresses (
    customer_id, label, city, district, street, building_no, unit_no, latitude, longitude
  ) values (
    actor,
    nullif(btrim(address_input->>'label'),''),
    btrim(address_input->>'city'),
    btrim(address_input->>'district'),
    nullif(btrim(address_input->>'street'),''),
    nullif(btrim(address_input->>'building_no'),''),
    nullif(btrim(address_input->>'unit_no'),''),
    nullif(address_input->>'latitude','')::numeric,
    nullif(address_input->>'longitude','')::numeric
  ) returning id into address_id;

  insert into public.maintenance_requests (
    user_id, customer_address_id, title, description, category, service_code,
    workflow_type, after_service_policy, service_metadata, priority, pricing_mode,
    offered_price, service_timing_mode, scheduled_date, scheduled_time,
    location_note, contact_phone, idempotency_key
  ) values (
    actor, address_id, btrim(title_input), nullif(btrim(description_input),''),
    catalog.legacy_category, catalog.code, catalog.workflow_type,
    catalog.after_service_policy, coalesce(service_metadata_input,'{}'::jsonb),
    priority_input, pricing_mode_input,
    case when pricing_mode_input = 'price' then offered_price_input else null end,
    timing_mode_input, scheduled_date_input, scheduled_time_input,
    nullif(btrim(location_note_input),''), nullif(btrim(contact_phone_input),''), command_key
  ) returning * into created_request;

  insert into public.maintenance_request_events (
    request_id, actor_id, event_type, to_status, payload, idempotency_key
  ) values (
    created_request.id, actor, 'request_created', 'new',
    jsonb_build_object('source','direct','service_code',catalog.code),
    command_key || ':created'
  );

  return created_request;
end;
$$;

alter table public.service_catalog enable row level security;
alter table public.maintenance_providers enable row level security;
alter table public.provider_service_catalog enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_request_events enable row level security;
alter table public.maintenance_request_media enable row level security;
alter table public.provider_offers enable row level security;
alter table public.provider_documents enable row level security;
alter table public.provider_invoices enable row level security;
alter table public.provider_transactions enable row level security;
alter table public.provider_settlements enable row level security;
alter table public.settlement_state_transitions enable row level security;

create policy service_catalog_public_read on public.service_catalog for select to anon, authenticated
using (is_active and customer_visible);
create policy providers_directory_read on public.maintenance_providers for select to authenticated
using (
  user_id = (select auth.uid())
  or (is_active and verification_status = 'approved')
  or (select private.is_platform_member(null))
);
create policy providers_self_insert on public.maintenance_providers for insert to authenticated
with check (user_id = (select auth.uid()) and verification_status = 'pending' and not is_active);
create policy providers_self_update on public.maintenance_providers for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and verified_by is null and verified_at is null);
create policy provider_services_scoped on public.provider_service_catalog for select to authenticated
using (
  exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid()))
  or (select private.is_platform_member(null))
);
create policy provider_services_self_manage on public.provider_service_catalog for all to authenticated
using (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())))
with check (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy requests_participant_read on public.maintenance_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid()))
  or (select private.is_platform_member(null))
);
create policy request_events_participant_read_v2 on public.maintenance_request_events for select to authenticated
using (exists (
  select 1 from public.maintenance_requests r
  left join public.maintenance_providers p on p.id = r.provider_id
  where r.id = request_id and (
    r.user_id = (select auth.uid()) or p.user_id = (select auth.uid())
    or (select private.is_platform_member(null))
  )
));
create policy request_media_participant_read on public.maintenance_request_media for select to authenticated
using (exists (
  select 1 from public.maintenance_requests r
  left join public.maintenance_providers p on p.id = r.provider_id
  where r.id = request_id and (
    r.user_id = (select auth.uid()) or p.user_id = (select auth.uid())
    or (select private.is_platform_member(null))
  )
));
create policy request_media_customer_insert on public.maintenance_request_media for insert to authenticated
with check (uploaded_by = (select auth.uid()) and exists (
  select 1 from public.maintenance_requests r where r.id = request_id and r.user_id = (select auth.uid())
));
create policy provider_offers_participant_read on public.provider_offers for select to authenticated
using (
  provider_user_id = (select auth.uid())
  or exists (select 1 from public.maintenance_requests r where r.id = request_id and r.user_id = (select auth.uid()))
  or (select private.is_platform_member(null))
);
create policy provider_documents_scoped on public.provider_documents for select to authenticated
using (provider_user_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy provider_documents_self_insert on public.provider_documents for insert to authenticated
with check (provider_user_id = (select auth.uid()) and status = 'pending');
create policy provider_finance_scoped_invoices on public.provider_invoices for select to authenticated
using (user_id = (select auth.uid()) or provider_user_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy provider_finance_scoped_transactions on public.provider_transactions for select to authenticated
using (provider_user_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy provider_finance_scoped_settlements on public.provider_settlements for select to authenticated
using (provider_user_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy settlement_transitions_scoped on public.settlement_state_transitions for select to authenticated
using (
  exists (select 1 from public.provider_settlements s where s.id = settlement_id and s.provider_user_id = (select auth.uid()))
  or exists (select 1 from public.provider_transactions t where t.id = transaction_id and t.provider_user_id = (select auth.uid()))
  or (select private.is_platform_member(null))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maintenance-media', 'maintenance-media', false, 20971520,
  array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/mp4']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy maintenance_media_upload_own on storage.objects for insert to authenticated
with check (bucket_id = 'maintenance-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy maintenance_media_read_participant on storage.objects for select to authenticated
using (
  bucket_id = 'maintenance-media' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.maintenance_request_media media
      join public.maintenance_requests request on request.id = media.request_id
      left join public.maintenance_providers provider on provider.id = request.provider_id
      where media.storage_path = name and (
        request.user_id = (select auth.uid()) or provider.user_id = (select auth.uid())
        or (select private.is_platform_member(null))
      )
    )
  )
);
create policy maintenance_media_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'maintenance-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select on public.service_catalog to anon, authenticated;
grant select, insert on public.maintenance_providers to authenticated;
grant update (
  name, phone, category, business_kind, estimated_price, response_time, avatar_url,
  lat, lng, service_radius_km, iban, bank_name, account_holder,
  vat_registration_number, spoken_languages, updated_at
) on public.maintenance_providers to authenticated;
grant select, insert, update, delete on public.provider_service_catalog to authenticated;
grant select on public.maintenance_requests, public.maintenance_request_events,
  public.maintenance_request_media, public.provider_offers, public.provider_documents,
  public.provider_invoices, public.provider_transactions, public.provider_settlements,
  public.settlement_state_transitions to authenticated;
grant insert on public.maintenance_request_media, public.provider_documents to authenticated;
grant execute on function public.get_customer_service_catalog() to anon, authenticated;
grant execute on function public.get_service_provider_availability() to anon, authenticated;
revoke execute on function public.create_maintenance_request_atomic(
  text,text,text,jsonb,public.maintenance_request_priority,public.maintenance_pricing_mode,numeric,text,date,time,text,text,jsonb,text
) from public, anon;
grant execute on function public.create_maintenance_request_atomic(
  text,text,text,jsonb,public.maintenance_request_priority,public.maintenance_pricing_mode,numeric,text,date,time,text,text,jsonb,text
) to authenticated;

insert into public.service_catalog
(code,family_code,name_ar,description_ar,legacy_category,workflow_type,after_service_policy,supports_offers,supports_fixed_price,sort_order)
values
('plumbing','repair','سباكة','تسريب، انسداد، خلاطات، صرف وتمديدات مياه','plumbing','repair','warranty',true,true,10),
('electrical','repair','كهرباء','أفياش، إنارة، قواطع وأعطال كهربائية','electrical','repair','warranty',true,true,20),
('hvac','repair','تكييف','تبريد، تنظيف، تسريب وصيانة المكيفات','hvac','repair','warranty',true,true,30),
('appliance_repair','repair','إصلاح أجهزة منزلية','غسالات، ثلاجات، أفران وأجهزة منزلية','general','repair','warranty',true,true,40),
('elevator','repair','مصاعد','أعطال وصيانة المصاعد','elevator','repair','warranty',true,true,50),
('carpentry','repair','نجارة وأبواب','أبواب، خزائن وأعمال نجارة منزلية','general','repair','warranty',true,true,60),
('locksmith','repair','أقفال ومفاتيح','فتح أقفال، تغيير أقفال ومفاتيح','general','repair','warranty',true,true,70),
('painting','repair','دهان وترميم','دهان، معجون وتشطيبات خفيفة','general','repair','warranty',true,true,80),
('leaks_insulation','repair','تسربات وعزل','كشف تسربات وعزل أسطح وخزانات','plumbing','repair','warranty',true,true,90),
('smart_home','repair','سمارت هوم وشبكات','كاميرات، شبكات، أقفال وأجهزة منزل ذكي','electrical','installation','warranty',true,true,100),
('home_cleaning','cleaning','تنظيف منزل','تنظيف كامل أو جزئي للمنزل','cleaning','cleaning','quality_claim',true,true,110),
('sofa_carpet_cleaning','cleaning','تنظيف كنب وسجاد','غسيل وتنظيف كنب وسجاد ومراتب','cleaning','cleaning','quality_claim',true,true,120),
('tank_cleaning','cleaning','تنظيف خزانات','تنظيف وتعقيم خزانات المياه','cleaning','cleaning','quality_claim',true,true,130),
('pest_control','cleaning','مكافحة حشرات','رش ومكافحة الحشرات والقوارض','cleaning','cleaning','quality_claim',true,true,140),
('garden_pool','cleaning','حدائق ومسابح','عناية بالحدائق والمسابح وتنظيفها','cleaning','cleaning','quality_claim',true,true,150),
('tv_installation','installation','تركيب شاشة','تعليق وتركيب الشاشات وتجهيز التوصيلات','general','installation','warranty',true,true,160),
('curtain_installation','installation','تركيب ستائر','تركيب ستائر ومسارات وقضبان','general','installation','warranty',true,true,170),
('furniture_assembly','installation','فك وتركيب أثاث','فك وتركيب وتجميع الأثاث','general','installation','warranty',true,true,180),
('filter_installation','installation','تركيب فلاتر وأجهزة','فلاتر مياه وأجهزة منزلية بسيطة','general','installation','warranty',true,true,190),
('furniture_moving','moving','نقل عفش','نقل أثاث بين المنازل مع تحميل وتنزيل','general','moving','quality_claim',true,true,200),
('appliance_moving','moving','نقل أجهزة','نقل أجهزة كهربائية وأغراض ثقيلة','general','moving','quality_claim',true,true,210),
('haul_away','moving','رفع مخلفات وأثاث','إزالة أثاث قديم أو مخلفات منزلية','general','moving','none',true,true,220),
('gas_cylinder','delivery','تغيير أسطوانة غاز','توصيل أو استبدال أسطوانة غاز','other','delivery','redelivery',false,true,230),
('bottled_water','delivery','كراتين مياه','توصيل كراتين مياه للمنزل','other','delivery','redelivery',false,true,240),
('ice_delivery','delivery','ثلج ومستلزمات','توصيل ثلج ومستلزمات منزلية سريعة','other','delivery','redelivery',false,true,250),
('other_service','general','خدمة أخرى','أي خدمة منزلية أخرى','other','general','none',true,true,999);

alter publication supabase_realtime add table public.maintenance_requests;
alter publication supabase_realtime add table public.maintenance_request_events;
alter publication supabase_realtime add table public.provider_offers;
