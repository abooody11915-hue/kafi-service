-- Cover foreign keys used by authorization, cleanup, joins and finance workflows.
create index maintenance_providers_verified_by_idx on public.maintenance_providers(verified_by) where verified_by is not null;
create index maintenance_request_events_actor_idx on public.maintenance_request_events(actor_id) where actor_id is not null;
create index maintenance_request_media_uploader_idx on public.maintenance_request_media(uploaded_by);
create index maintenance_requests_address_idx on public.maintenance_requests(customer_address_id);
create index provider_documents_reviewer_idx on public.provider_documents(reviewed_by) where reviewed_by is not null;
create index provider_invoices_provider_idx on public.provider_invoices(provider_id);
create index provider_invoices_provider_user_idx on public.provider_invoices(provider_user_id);
create index provider_invoices_customer_idx on public.provider_invoices(user_id);
create index provider_offers_provider_user_idx on public.provider_offers(provider_user_id,status,created_at desc);
create index provider_settlements_confirmer_idx on public.provider_settlements(confirmed_by) where confirmed_by is not null;
create index provider_settlements_provider_user_idx on public.provider_settlements(provider_user_id,status,created_at desc);
create index provider_transactions_provider_user_idx on public.provider_transactions(provider_user_id,status,created_at desc);
create index provider_transactions_settlement_idx on public.provider_transactions(settlement_id) where settlement_id is not null;
create index service_catalog_creator_idx on public.service_catalog(created_by) where created_by is not null;
create index settlement_transitions_actor_idx on public.settlement_state_transitions(actor_user_id) where actor_user_id is not null;
create index settlement_transitions_settlement_idx on public.settlement_state_transitions(settlement_id,created_at) where settlement_id is not null;
create index settlement_transitions_transaction_idx on public.settlement_state_transitions(transaction_id,created_at) where transaction_id is not null;
