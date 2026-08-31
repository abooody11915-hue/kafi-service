-- Harden the first production-shaped foundation after running Supabase advisors.

revoke execute on function public.transition_service_request(
  uuid, public.request_status, public.request_status, text, jsonb
) from public, anon, authenticated;
grant execute on function public.transition_service_request(
  uuid, public.request_status, public.request_status, text, jsonb
) to service_role;

create or replace function private.is_partner_member(target_partner uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.partner_memberships membership
    where membership.partner_id = target_partner
      and membership.user_id = auth.uid()
      and membership.is_active
  );
$$;
revoke all on function private.is_partner_member(uuid) from public, anon, authenticated;
grant execute on function private.is_partner_member(uuid) to authenticated;

create policy platform_memberships_self_read
on public.platform_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_platform_member(array['platform_owner']::public.platform_role[]))
);

create policy partners_scoped_read
on public.partners for select to authenticated
using (
  status = 'active'
  or private.is_partner_member(id)
  or (select private.is_platform_member(null))
);

create policy partner_memberships_scoped_read
on public.partner_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_partner_member(partner_id)
  or (select private.is_platform_member(null))
);

create policy partner_customer_links_scoped_read
on public.partner_customer_links for select to authenticated
using (
  customer_id = (select auth.uid())
  or private.is_partner_member(partner_id)
  or (select private.is_platform_member(null))
);

create policy service_assignments_scoped_read
on public.service_assignments for select to authenticated
using (
  private.owns_provider(provider_id)
  or exists (
    select 1 from public.service_requests request
    where request.id = request_id and request.customer_id = (select auth.uid())
  )
  or (select private.is_platform_member(null))
);

create policy verification_reviews_scoped_read
on public.verification_reviews for select to authenticated
using (
  exists (
    select 1 from public.verification_cases verification_case
    where verification_case.id = case_id
      and (
        private.owns_provider(verification_case.provider_id)
        or (select private.is_platform_member(array['platform_owner','compliance_reviewer']::public.platform_role[]))
      )
  )
);

create policy ledger_accounts_scoped_read
on public.ledger_accounts for select to authenticated
using (
  (owner_type = 'provider' and owner_id is not null and private.owns_provider(owner_id))
  or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
);

create policy ledger_entries_scoped_read
on public.ledger_entries for select to authenticated
using (
  exists (
    select 1 from public.ledger_accounts account
    where account.id = account_id
      and account.owner_type = 'provider'
      and account.owner_id is not null
      and private.owns_provider(account.owner_id)
  )
  or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
);

create policy ledger_transactions_scoped_read
on public.ledger_transactions for select to authenticated
using (
  exists (
    select 1
    from public.ledger_entries entry
    join public.ledger_accounts account on account.id = entry.account_id
    where entry.transaction_id = ledger_transactions.id
      and account.owner_type = 'provider'
      and account.owner_id is not null
      and private.owns_provider(account.owner_id)
  )
  or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
);

create policy settlement_items_scoped_read
on public.settlement_items for select to authenticated
using (
  exists (
    select 1 from public.settlement_batches batch
    where batch.id = batch_id
      and (
        private.owns_provider(batch.provider_id)
        or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
      )
  )
);

create policy audit_events_owner_read
on public.audit_events for select to authenticated
using ((select private.is_platform_member(array['platform_owner']::public.platform_role[])));

grant select on
  public.platform_memberships,
  public.partners,
  public.partner_memberships,
  public.partner_customer_links,
  public.service_assignments,
  public.verification_reviews,
  public.ledger_accounts,
  public.ledger_entries,
  public.ledger_transactions,
  public.settlement_items,
  public.audit_events
to authenticated;

create index audit_events_actor_idx on public.audit_events(actor_id) where actor_id is not null;
create index customer_addresses_customer_idx on public.customer_addresses(customer_id);
create index ledger_entries_account_idx on public.ledger_entries(account_id);
create index ledger_entries_transaction_idx on public.ledger_entries(transaction_id);
create index ledger_transactions_reversed_by_idx on public.ledger_transactions(reversed_by) where reversed_by is not null;
create index partner_customer_links_customer_idx on public.partner_customer_links(customer_id);
create index partner_memberships_user_idx on public.partner_memberships(user_id) where is_active;
create index service_assignments_assigned_by_idx on public.service_assignments(assigned_by);
create index service_assignments_provider_idx on public.service_assignments(provider_id) where ended_at is null;
create index service_assignments_technician_idx on public.service_assignments(technician_id) where technician_id is not null and ended_at is null;
create index service_catalog_items_family_idx on public.service_catalog_items(family_id);
create index service_request_events_actor_idx on public.service_request_events(actor_id) where actor_id is not null;
create index service_requests_address_idx on public.service_requests(address_id);
create index service_requests_service_idx on public.service_requests(service_id);
create index settlement_batches_approved_by_idx on public.settlement_batches(approved_by) where approved_by is not null;
create index settlement_batches_created_by_idx on public.settlement_batches(created_by);
create index settlement_batches_provider_idx on public.settlement_batches(provider_id);
create index verification_cases_decided_by_idx on public.verification_cases(decided_by) where decided_by is not null;
create index verification_cases_provider_idx on public.verification_cases(provider_id);
create index verification_reviews_case_idx on public.verification_reviews(case_id);
create index verification_reviews_reviewer_idx on public.verification_reviews(reviewer_id);
