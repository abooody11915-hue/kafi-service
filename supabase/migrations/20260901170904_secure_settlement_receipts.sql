-- Private, ownership-scoped settlement receipts.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('settlement-receipts','settlement-receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update
set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy settlement_receipts_upload_own on storage.objects for insert to authenticated
with check(bucket_id='settlement-receipts' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy settlement_receipts_read_scoped on storage.objects for select to authenticated
using(bucket_id='settlement-receipts' and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or (select private.is_platform_member(array['platform_owner','finance_operator']::public.platform_role[]))
));

create policy settlement_receipts_delete_own on storage.objects for delete to authenticated
using(bucket_id='settlement-receipts' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.submit_provider_settlement_receipt(settlement_id_input uuid, receipt_path_input text)
returns public.provider_settlements
language plpgsql security definer set search_path = ''
as $$
declare actor uuid := (select auth.uid()); settlement public.provider_settlements;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into settlement from public.provider_settlements where id=settlement_id_input for update;
  if not found or settlement.provider_user_id <> actor then raise exception 'settlement_not_found'; end if;
  if settlement.status <> 'pending_payment' then raise exception 'settlement_not_payable'; end if;
  if receipt_path_input !~ ('^' || actor::text || '/' || settlement.id::text || '/') then raise exception 'invalid_receipt_path'; end if;
  if not exists (
    select 1 from storage.objects object
    where object.bucket_id='settlement-receipts' and object.name=receipt_path_input and object.owner_id=actor::text
  ) then raise exception 'receipt_not_uploaded'; end if;
  update public.provider_settlements
  set status='payment_submitted',receipt_storage_path=receipt_path_input,submitted_at=now(),updated_at=now()
  where id=settlement.id returning * into settlement;
  insert into public.settlement_state_transitions(settlement_id,from_state,to_state,actor_user_id,reason)
  values(settlement.id,'pending_payment','payment_submitted',actor,'receipt_submitted');
  return settlement;
end;
$$;

revoke all on function public.submit_provider_settlement_receipt(uuid,text) from public, anon;
grant execute on function public.submit_provider_settlement_receipt(uuid,text) to authenticated;
