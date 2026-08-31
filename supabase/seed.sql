-- Synthetic development data only. Never replace with KAFI/KAFI 2 exports.
insert into public.service_families (code, name_ar, name_en, sort_order) values
  ('ac', 'التكييف', 'Air conditioning', 10),
  ('plumbing', 'السباكة', 'Plumbing', 20),
  ('electrical', 'الكهرباء', 'Electrical', 30)
on conflict (code) do nothing;

insert into public.service_catalog_items (family_id, code, name_ar, name_en, description_ar, requires_quote)
select id, 'ac_inspection', 'فحص المكيف', 'AC inspection', 'تشخيص العطل وإصدار توصية واضحة', false from public.service_families where code = 'ac'
on conflict (code) do nothing;
insert into public.service_catalog_items (family_id, code, name_ar, name_en, description_ar, requires_quote)
select id, 'water_leak', 'إصلاح تسرب مياه', 'Water leak repair', 'تحديد مصدر التسرب وتقديم عرض الإصلاح', true from public.service_families where code = 'plumbing'
on conflict (code) do nothing;
insert into public.service_catalog_items (family_id, code, name_ar, name_en, description_ar, requires_quote)
select id, 'electrical_fault', 'فحص عطل كهربائي', 'Electrical fault inspection', 'فحص آمن للعطل وإصدار تقرير', true from public.service_families where code = 'electrical'
on conflict (code) do nothing;
