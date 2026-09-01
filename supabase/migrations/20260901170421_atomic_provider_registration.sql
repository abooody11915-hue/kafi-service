-- Register a provider and its selected services in one transaction.
-- No users, providers, or historical rows are copied by this migration.

create or replace function public.register_maintenance_provider(
  name_input text,
  phone_input text,
  iban_input text,
  business_kind_input public.provider_business_type,
  service_codes_input text[]
)
returns public.maintenance_providers
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  provider public.maintenance_providers;
  normalized_name text := nullif(btrim(name_input), '');
  normalized_iban text := upper(regexp_replace(coalesce(iban_input, ''), '\s+', '', 'g'));
  requested_count integer;
  valid_count integer;
  primary_category public.maintenance_category;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if normalized_name is null or char_length(normalized_name) < 3 then raise exception 'valid_provider_name_required'; end if;
  if business_kind_input not in ('individual', 'company') then raise exception 'invalid_business_kind'; end if;
  if normalized_iban !~ '^SA[0-9]{22}$' then raise exception 'valid_saudi_iban_required'; end if;
  if exists (select 1 from public.maintenance_providers existing where existing.user_id = actor) then
    raise exception 'provider_profile_exists';
  end if;

  select count(distinct code) into requested_count
  from unnest(coalesce(service_codes_input, array[]::text[])) code;
  if requested_count = 0 or requested_count > 20 then raise exception 'service_selection_required'; end if;

  select count(*), min(catalog.legacy_category::text)::public.maintenance_category
  into valid_count, primary_category
  from public.service_catalog catalog
  where catalog.code = any(service_codes_input)
    and catalog.is_active
    and catalog.provider_selectable;
  if valid_count <> requested_count then raise exception 'invalid_service_selection'; end if;

  insert into public.maintenance_providers (
    user_id, name, phone, iban, business_kind, category,
    verification_status, is_active
  ) values (
    actor, normalized_name, nullif(btrim(phone_input), ''), normalized_iban,
    business_kind_input, coalesce(primary_category, 'general'), 'pending', false
  ) returning * into provider;

  insert into public.provider_service_catalog(provider_id, service_code)
  select provider.id, selected.code
  from (select distinct unnest(service_codes_input) as code) selected;

  return provider;
end;
$$;

revoke all on function public.register_maintenance_provider(text,text,text,public.provider_business_type,text[]) from public, anon;
grant execute on function public.register_maintenance_provider(text,text,text,public.provider_business_type,text[]) to authenticated;
