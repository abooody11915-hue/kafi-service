-- Explicitly scope SECURITY DEFINER commands and remove overlapping RLS work.

revoke all on function public.accept_provider_offer(uuid,text) from public, anon;
revoke all on function public.confirm_maintenance_payment(uuid) from public, anon;
revoke all on function public.confirm_maintenance_work(uuid,text) from public, anon;
revoke all on function public.confirm_provider_settlement(uuid,text) from public, anon;
revoke all on function public.create_provider_settlement() from public, anon;
revoke all on function public.get_provider_opportunities() from public, anon;
revoke all on function public.open_maintenance_warranty(uuid,text,text) from public, anon;
revoke all on function public.register_provider_document(public.provider_document_type,text) from public, anon;
revoke all on function public.respond_to_provider_offer(uuid,text,numeric,text) from public, anon;
revoke all on function public.review_maintenance_provider(uuid,public.provider_verification_status,text) from public, anon;
revoke all on function public.submit_maintenance_payment(uuid,text) from public, anon;
revoke all on function public.submit_provider_settlement_receipt(uuid,text) from public, anon;
revoke all on function public.submit_provider_verification() from public, anon;
revoke all on function public.transition_maintenance_request(uuid,public.maintenance_status,public.maintenance_status,text,jsonb) from public, anon;

create or replace function public.get_customer_service_catalog()
returns table(
  code text, family_code text, name_ar text, description_ar text,
  legacy_category public.maintenance_category, workflow_type text,
  after_service_policy text, supports_offers boolean,
  supports_fixed_price boolean, sort_order integer
)
language sql stable security invoker set search_path = ''
as $$
  select catalog.code, catalog.family_code, catalog.name_ar, catalog.description_ar,
         catalog.legacy_category, catalog.workflow_type, catalog.after_service_policy,
         catalog.supports_offers, catalog.supports_fixed_price, catalog.sort_order
  from public.service_catalog catalog
  where catalog.is_active and catalog.customer_visible
  order by catalog.sort_order, catalog.code;
$$;
grant execute on function public.get_customer_service_catalog() to anon, authenticated;

create policy providers_public_availability on public.maintenance_providers for select to anon
using (is_active and verification_status = 'approved');
create policy provider_services_public_availability on public.provider_service_catalog for select to anon
using (is_active and exists (
  select 1 from public.maintenance_providers provider
  where provider.id = provider_id and provider.is_active and provider.verification_status = 'approved'
));
grant select (id,is_active,verification_status) on public.maintenance_providers to anon;
grant select (provider_id,service_code,is_active) on public.provider_service_catalog to anon;

create or replace function public.get_service_provider_availability()
returns table(service_code text, provider_count integer)
language sql stable security invoker set search_path = ''
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
grant execute on function public.get_service_provider_availability() to anon, authenticated;

drop policy if exists provider_services_self_manage on public.provider_service_catalog;
create policy provider_services_self_insert on public.provider_service_catalog for insert to authenticated
with check (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy provider_services_self_update on public.provider_service_catalog for update to authenticated
using (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())))
with check (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy provider_services_self_delete on public.provider_service_catalog for delete to authenticated
using (exists (select 1 from public.maintenance_providers p where p.id = provider_id and p.user_id = (select auth.uid())));
