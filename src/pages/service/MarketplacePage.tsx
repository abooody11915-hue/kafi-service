import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Search, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceShell } from "@/components/service/ServiceShell";
import { EmptyState, SectionHeading } from "@/components/service/ServiceUI";
import ServiceVisual from "@/components/services/ServiceVisual";
import { COMMON_SERVICES, SERVICE_CATALOG, SERVICE_FAMILIES } from "@/lib/serviceCatalog";
import { supabase } from "@/integrations/supabase/client";

type CatalogRow = { code: string; family_code: string; name_ar: string; description_ar: string | null; sort_order: number };

export function MarketplacePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["service-marketplace-catalog"],
    queryFn: async () => {
      const { data: rows, error } = await (supabase as any).rpc("get_customer_service_catalog");
      if (error) throw error;
      return rows as CatalogRow[];
    },
  });
  const rows = data.length ? data : SERVICE_CATALOG.map((item, index) => ({ code: item.code, family_code: item.family, name_ar: item.label, description_ar: item.description, sort_order: index }));
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");
    if (!term) return rows;
    return rows.filter((item) => `${item.name_ar} ${item.description_ar ?? ""}`.toLocaleLowerCase("ar").includes(term));
  }, [rows, search]);
  const start = (serviceCode?: string, timing?: "asap" | "scheduled") => {
    const params = new URLSearchParams();
    if (serviceCode) params.set("service", serviceCode);
    if (timing) params.set("timing", timing);
    navigate(`/request/new?${params.toString()}`);
  };
  const commonRows = COMMON_SERVICES.map((item) => rows.find((row) => row.code === item.code)).filter(Boolean) as CatalogRow[];

  return <ServiceShell>
    <section className="relative overflow-hidden rounded-[var(--service-radius-xl)] bg-[linear-gradient(145deg,var(--service-brand-strong),var(--service-brand))] px-5 py-8 text-white shadow-[var(--service-shadow-float)] md:px-10 md:py-12">
      <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black ring-1 ring-white/15"><ShieldCheck className="h-4 w-4" aria-hidden="true" />مزودون موثقون وضمان واضح</span>
        <h1 className="mt-5 text-3xl font-black leading-[1.35] tracking-tight md:text-5xl">من طلب الخدمة<br />إلى إتمامها بثقة.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">اختر احتياجك، قارن العروض، وتابع التنفيذ والدفع والضمان من سجل واحد واضح.</p>
        <div className="mt-7 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => start(undefined, "asap")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-primary shadow-xl"><Zap className="h-4 w-4" aria-hidden="true" />أحتاج خدمة الآن</button>
          <button onClick={() => start(undefined, "scheduled")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-black ring-1 ring-white/25"><CalendarDays className="h-4 w-4" aria-hidden="true" />أحجز موعدًا</button>
        </div>
      </div>
    </section>

    <section aria-label="البحث عن خدمة" className="relative z-10 mx-auto -mt-5 max-w-3xl px-2">
      <Search className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
      <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ما الخدمة التي تحتاجها؟" className="h-16 w-full rounded-[20px] border bg-white pr-12 pl-4 text-base font-bold shadow-[var(--service-shadow-float)] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10" />
    </section>

    {!search.trim() && <>
      <section className="mt-9"><SectionHeading title="الخدمات الأكثر طلبًا" description="وصول سريع إلى الاحتياجات اليومية" />
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">{commonRows.map((service) => <button key={service.code} onClick={() => start(service.code)} className="service-panel flex min-w-[220px] items-center gap-3 p-3 text-right transition hover:-translate-y-0.5 hover:shadow-md"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl"><ServiceVisual code={service.code} family={service.family_code} compact /></div><span className="min-w-0 flex-1"><strong className="block text-sm font-black">{service.name_ar}</strong><small className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{service.description_ar}</small></span><ArrowLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /></button>)}</div>
      </section>

      <section className="mt-9"><SectionHeading title="تصفح حسب القسم" description="اختر المجال ثم حدد الخدمة الدقيقة" action={isLoading ? <span className="text-xs text-muted-foreground">تحديث الكتالوج…</span> : undefined} />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">{SERVICE_FAMILIES.map((family) => { const count = rows.filter((row) => row.family_code === family.code).length; if (!count) return null; return <button key={family.code} onClick={() => document.getElementById(`family-${family.code}`)?.scrollIntoView({ behavior: "smooth" })} className="service-panel overflow-hidden text-right transition hover:-translate-y-0.5 hover:shadow-md"><div className="h-28 border-b"><ServiceVisual family={family.code} /></div><div className="flex items-center justify-between p-4"><span><strong className="block text-sm font-black">{family.label}</strong><small className="mt-1 block text-xs text-muted-foreground">{count} خدمات</small></span><span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></span></div></button>; })}</div>
      </section>
    </>}

    <section className="mt-10 space-y-10">
      {(search.trim() ? [{ code: "results", label: `نتائج البحث (${filtered.length})` }] : SERVICE_FAMILIES).map((family) => {
        const services = filtered.filter((item) => search.trim() || item.family_code === family.code);
        if (!services.length) return null;
        return <div id={`family-${family.code}`} key={family.code}><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="service-section-title">{family.label}</h2></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map((service) => <button key={service.code} onClick={() => start(service.code)} className="service-panel group flex min-h-28 items-center gap-3 p-3 text-right transition hover:-translate-y-0.5 hover:shadow-md"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-[16px]"><ServiceVisual code={service.code} family={service.family_code} compact /></div><span className="min-w-0 flex-1"><strong className="block text-sm font-black">{service.name_ar}</strong><small className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{service.description_ar}</small></span><ArrowLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /></button>)}</div></div>;
      })}
      {!filtered.length && <EmptyState icon={Search} title="لم نجد خدمة مطابقة" description="يمكنك إنشاء طلب مخصص ووصف ما تحتاجه." action={<button onClick={() => start("other_service")} className="text-sm font-black text-primary">إنشاء طلب مخصص</button>} />}
    </section>

    {!search.trim() && <section className="mt-12 rounded-[var(--service-radius-lg)] bg-[var(--service-surface-subtle)] p-5 md:p-7"><SectionHeading title="كيف تعمل كافي سيرفس؟" description="حقوق واضحة لكل طرف من البداية" /><div className="mt-5 grid gap-4 md:grid-cols-3">{[
      [BadgeCheck, "اطلب بوضوح", "حدد الخدمة والعنوان والموعد وأرفق ما يساعد المزود."],
      [Star, "قارن بثقة", "راجع السعر والتقييم وتفاصيل العرض قبل الاختيار."],
      [CheckCircle2, "أكد ثم ادفع", "لا تكتمل المهمة ماليًا قبل تأكيد التنفيذ، مع مسار ضمان موثق."],
    ].map(([Icon, title, text], index) => { const StepIcon = Icon as typeof BadgeCheck; return <article key={String(title)} className="rounded-2xl bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 font-black text-primary">{index + 1}</span><StepIcon className="mt-5 h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-2 font-black">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p></article>; })}</div></section>}
  </ServiceShell>;
}
