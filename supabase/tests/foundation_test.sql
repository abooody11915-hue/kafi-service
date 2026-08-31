begin;
select plan(13);

select has_table('public', 'service_requests', 'service requests exist');
select has_table('public', 'service_request_events', 'append-only request events exist');
select has_table('public', 'provider_organizations', 'provider entity is separate');
select has_table('public', 'verification_cases', 'verification has its own lifecycle');
select has_table('public', 'ledger_transactions', 'ledger transactions exist');
select has_table('public', 'ledger_entries', 'ledger entries exist');
select has_table('public', 'settlement_batches', 'settlement batches exist');
select has_function('public', 'transition_service_request', array['uuid','request_status','request_status','text','jsonb'], 'request command exists');

select policies_are('public', 'service_requests', array[
  'requests_customer_create_draft',
  'requests_customer_read'
], 'request policies are explicit');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.service_requests'::regclass),
  'RLS is enabled on service requests'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ledger_entries'::regclass),
  'RLS is enabled on ledger entries'
);
select col_type_is('public', 'customer_invoices', 'subtotal_minor', 'bigint', 'money is stored in minor units');
select col_type_is('public', 'customer_invoices', 'total_minor', 'bigint', 'invoice total is an exact integer');

select * from finish();
rollback;
