-- Independent KAFI Service platform foundation.
-- The maintenance domain is extracted in later migrations from KAFI 2 without copying production data.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

create type public.platform_role as enum (
  'platform_owner', 'platform_operator', 'compliance_reviewer',
  'finance_operator', 'support_agent'
);
create type public.partner_role as enum ('partner_admin');
create type public.provider_role as enum ('provider_owner', 'provider_dispatcher', 'technician');
create type public.request_status as enum (
  'draft', 'submitted', 'triaged', 'quoting', 'customer_confirmed',
  'assigned', 'scheduled', 'en_route', 'arrived', 'in_progress',
  'work_completed', 'awaiting_customer_acceptance', 'completed',
  'cancelled', 'expired', 'disputed', 'rework_required', 'on_hold'
);
create type public.verification_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.platform_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,40}$'),
  name_ar text not null,
  name_en text,
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  created_at timestamptz not null default now()
);

create table public.partner_memberships (
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.partner_role not null default 'partner_admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (partner_id, user_id, role)
);

create table public.partner_customer_links (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  external_customer_ref text not null,
  external_property_ref text,
  consented_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, external_customer_ref)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text,
  city text not null,
  district text not null,
  street text,
  building_no text,
  unit_no text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

create table public.provider_organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  organization_kind text not null check (organization_kind in ('individual', 'company')),
  commercial_registration_no text,
  status public.verification_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_memberships (
  provider_id uuid not null references public.provider_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.provider_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (provider_id, user_id, role)
);

create table public.verification_cases (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_organizations(id) on delete cascade,
  status public.verification_status not null default 'draft',
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references auth.users(id),
  decision_reason text,
  created_at timestamptz not null default now()
);

create table public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.verification_cases(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  from_status public.verification_status not null,
  to_status public.verification_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.service_families (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  name_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.service_families(id),
  code text not null unique,
  name_ar text not null,
  name_en text,
  description_ar text,
  requires_quote boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service_catalog_items(id),
  version integer not null check (version > 0),
  base_price_minor bigint check (base_price_minor is null or base_price_minor >= 0),
  currency char(3) not null default 'SAR',
  warranty_days integer not null default 0 check (warranty_days >= 0),
  effective_from timestamptz not null,
  effective_to timestamptz,
  unique (service_id, version),
  check (effective_to is null or effective_to > effective_from)
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number bigint generated always as identity unique,
  customer_id uuid not null references auth.users(id),
  address_id uuid not null references public.customer_addresses(id),
  service_id uuid not null references public.service_catalog_items(id),
  partner_id uuid references public.partners(id),
  partner_external_ref text,
  status public.request_status not null default 'draft',
  title text not null,
  description text not null,
  idempotency_key text not null,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);
create unique index service_requests_partner_ref_unique
  on public.service_requests(partner_id, partner_external_ref)
  where partner_id is not null and partner_external_ref is not null;

create table public.service_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  event_type text not null,
  from_status public.request_status,
  to_status public.request_status,
  actor_id uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (request_id, idempotency_key)
);

create table public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id),
  provider_id uuid not null references public.provider_organizations(id),
  technician_id uuid references auth.users(id),
  assigned_by uuid not null references auth.users(id),
  accepted_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_active_assignment_per_request
  on public.service_assignments(request_id) where ended_at is null;

create table public.customer_invoices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id),
  invoice_number bigint generated always as identity unique,
  status text not null check (status in ('draft', 'issued', 'paid', 'void', 'refunded')),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  tax_minor bigint not null check (tax_minor >= 0),
  total_minor bigint generated always as (subtotal_minor + tax_minor) stored,
  currency char(3) not null default 'SAR',
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  reference_type text not null,
  reference_id uuid not null,
  description text not null,
  posted_at timestamptz not null default now(),
  reversed_by uuid references public.ledger_transactions(id),
  created_at timestamptz not null default now()
);

create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('platform', 'provider', 'partner', 'customer', 'gateway')),
  owner_id uuid,
  code text not null,
  currency char(3) not null default 'SAR',
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_type, owner_id, code, currency)
);

create table public.ledger_entries (
  id bigint generated always as identity primary key,
  transaction_id uuid not null references public.ledger_transactions(id),
  account_id uuid not null references public.ledger_accounts(id),
  direction text not null check (direction in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now()
);

create table public.settlement_batches (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_organizations(id),
  status text not null default 'draft' check (status in ('draft', 'approved', 'processing', 'paid', 'failed', 'cancelled')),
  currency char(3) not null default 'SAR',
  total_minor bigint not null default 0 check (total_minor >= 0),
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.settlement_items (
  batch_id uuid not null references public.settlement_batches(id),
  ledger_entry_id bigint not null unique references public.ledger_entries(id),
  amount_minor bigint not null check (amount_minor > 0),
  primary key (batch_id, ledger_entry_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_platform_member(required_roles public.platform_role[] default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_memberships membership
    where membership.user_id = auth.uid()
      and membership.is_active
      and (required_roles is null or membership.role = any(required_roles))
  );
$$;

create or replace function private.owns_provider(target_provider uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.provider_memberships membership
    where membership.provider_id = target_provider
      and membership.user_id = auth.uid()
      and membership.is_active
  );
$$;

create or replace function private.is_request_provider_member(target_request uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_assignments assignment
    join public.provider_memberships membership
      on membership.provider_id = assignment.provider_id
    where assignment.request_id = target_request
      and assignment.ended_at is null
      and membership.user_id = auth.uid()
      and membership.is_active
  );
$$;

create or replace function public.transition_service_request(
  target_request uuid,
  expected_status public.request_status,
  next_status public.request_status,
  command_key text,
  event_payload jsonb default '{}'::jsonb
)
returns public.service_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  current_request public.service_requests;
  permitted boolean := false;
  actor_is_platform boolean := false;
  actor_is_provider boolean := false;
  actor_is_customer boolean := false;
begin
  select * into current_request
  from public.service_requests
  where id = target_request
  for update;

  if not found then raise exception 'request_not_found'; end if;
  if exists (
    select 1 from public.service_request_events event
    where event.request_id = target_request and event.idempotency_key = command_key
  ) then
    return current_request;
  end if;
  if current_request.status <> expected_status then raise exception 'stale_request_status'; end if;

  actor_is_platform := private.is_platform_member(null);
  actor_is_provider := private.is_request_provider_member(target_request);
  actor_is_customer := current_request.customer_id = auth.uid();

  permitted :=
    (actor_is_customer and (
      (expected_status = 'draft' and next_status in ('submitted', 'cancelled')) or
      (expected_status = 'submitted' and next_status = 'cancelled') or
      (expected_status = 'quoting' and next_status in ('customer_confirmed', 'cancelled')) or
      (expected_status = 'awaiting_customer_acceptance' and next_status in ('completed', 'disputed', 'rework_required')) or
      (expected_status = 'completed' and next_status = 'disputed')
    )) or
    (actor_is_provider and (
      (expected_status = 'assigned' and next_status in ('scheduled', 'on_hold')) or
      (expected_status = 'scheduled' and next_status in ('en_route', 'on_hold')) or
      (expected_status = 'en_route' and next_status in ('arrived', 'on_hold')) or
      (expected_status = 'arrived' and next_status in ('in_progress', 'on_hold')) or
      (expected_status = 'in_progress' and next_status in ('work_completed', 'on_hold')) or
      (expected_status = 'rework_required' and next_status in ('assigned', 'scheduled'))
    )) or
    (actor_is_platform and case expected_status
      when 'submitted' then next_status in ('triaged', 'cancelled', 'expired')
      when 'triaged' then next_status in ('quoting', 'assigned', 'on_hold', 'cancelled')
      when 'quoting' then next_status in ('customer_confirmed', 'expired', 'cancelled')
      when 'customer_confirmed' then next_status in ('assigned', 'cancelled')
      when 'assigned' then next_status in ('scheduled', 'on_hold', 'cancelled')
      when 'scheduled' then next_status in ('en_route', 'on_hold', 'cancelled')
      when 'work_completed' then next_status in ('awaiting_customer_acceptance', 'rework_required')
      when 'disputed' then next_status in ('completed', 'rework_required')
      when 'rework_required' then next_status in ('assigned', 'scheduled')
      when 'on_hold' then next_status in ('triaged', 'assigned', 'scheduled', 'in_progress', 'cancelled')
      else false
    end);

  if not permitted then raise exception 'invalid_status_transition'; end if;

  insert into public.service_request_events
    (request_id, event_type, from_status, to_status, actor_id, payload, idempotency_key)
  values
    (target_request, 'status_changed', expected_status, next_status, auth.uid(), event_payload, command_key);

  update public.service_requests
  set status = next_status,
      submitted_at = case when next_status = 'submitted' then coalesce(submitted_at, now()) else submitted_at end,
      completed_at = case when next_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
      updated_at = now()
  where id = target_request
  returning * into current_request;

  return current_request;
end;
$$;

alter table public.profiles enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.partners enable row level security;
alter table public.partner_memberships enable row level security;
alter table public.partner_customer_links enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.provider_organizations enable row level security;
alter table public.provider_memberships enable row level security;
alter table public.verification_cases enable row level security;
alter table public.verification_reviews enable row level security;
alter table public.service_families enable row level security;
alter table public.service_catalog_items enable row level security;
alter table public.service_catalog_versions enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_events enable row level security;
alter table public.service_assignments enable row level security;
alter table public.customer_invoices enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.settlement_batches enable row level security;
alter table public.settlement_items enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy addresses_customer_all on public.customer_addresses for all to authenticated using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
create policy catalog_families_public_read on public.service_families for select to anon, authenticated using (is_active);
create policy catalog_items_public_read on public.service_catalog_items for select to anon, authenticated using (is_active);
create policy catalog_versions_public_read on public.service_catalog_versions for select to anon, authenticated using (effective_from <= now() and (effective_to is null or effective_to > now()));
create policy requests_customer_read on public.service_requests for select to authenticated using (customer_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy requests_customer_create_draft on public.service_requests for insert to authenticated with check (
  customer_id = (select auth.uid())
  and status = 'draft'
  and partner_id is null
  and partner_external_ref is null
  and exists (
    select 1 from public.customer_addresses address
    where address.id = address_id and address.customer_id = (select auth.uid())
  )
  and exists (
    select 1 from public.service_catalog_items service
    where service.id = service_id and service.is_active
  )
);
create policy request_events_participant_read on public.service_request_events for select to authenticated using (
  exists (select 1 from public.service_requests request where request.id = request_id and (request.customer_id = (select auth.uid()) or (select private.is_platform_member(null))))
);
create policy providers_members_read on public.provider_organizations for select to authenticated using (private.owns_provider(id) or (select private.is_platform_member(null)));
create policy provider_memberships_self_read on public.provider_memberships for select to authenticated using (user_id = (select auth.uid()) or (select private.is_platform_member(null)));
create policy verification_scoped_read on public.verification_cases for select to authenticated using (private.owns_provider(provider_id) or (select private.is_platform_member(array['platform_owner','compliance_reviewer']::public.platform_role[])));
create policy invoices_customer_read on public.customer_invoices for select to authenticated using (
  exists (select 1 from public.service_requests request where request.id = request_id and request.customer_id = (select auth.uid()))
  or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
);
create policy settlements_provider_read on public.settlement_batches for select to authenticated using (
  private.owns_provider(provider_id) or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
);

-- Explicit grants are intentional: new Supabase projects may not expose new public tables automatically.
grant usage on schema public to anon, authenticated;
grant select on public.service_families, public.service_catalog_items, public.service_catalog_versions to anon, authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, phone, locale, updated_at) on public.profiles to authenticated;
grant select, insert on public.service_requests to authenticated;
grant select on public.service_request_events, public.provider_organizations, public.provider_memberships, public.verification_cases, public.customer_invoices, public.settlement_batches to authenticated;
revoke execute on function public.transition_service_request(uuid, public.request_status, public.request_status, text, jsonb) from public, anon, authenticated;
grant execute on function public.transition_service_request(uuid, public.request_status, public.request_status, text, jsonb) to service_role;
revoke all on function private.handle_new_auth_user(), private.is_platform_member(public.platform_role[]), private.owns_provider(uuid), private.is_request_provider_member(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_platform_member(public.platform_role[]), private.owns_provider(uuid), private.is_request_provider_member(uuid) to authenticated;

create index service_requests_customer_created_idx on public.service_requests(customer_id, created_at desc);
create index service_requests_status_created_idx on public.service_requests(status, created_at desc);
create index service_request_events_request_created_idx on public.service_request_events(request_id, created_at);
create index provider_memberships_user_idx on public.provider_memberships(user_id) where is_active;
create index platform_memberships_user_idx on public.platform_memberships(user_id) where is_active;

alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.service_request_events;
