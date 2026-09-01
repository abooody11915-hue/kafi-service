import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceShell } from "@/components/service/ServiceShell";
import ServiceVisual from "@/components/services/ServiceVisual";
import { SERVICE_CATALOG, SERVICE_FAMILIES } from "@/lib/serviceCatalog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((item) => `${item.name_ar} ${item.description_ar ?? ""}`.toLowerCase().includes(term));
  }, [rows, search]);
  const start = (serviceCode?: string, timing?: "asap" | "scheduled") => {
    const params = new URLSearchParams();
    if (serviceCode) params.set("service", serviceCode);
    if (timing) params.set("timing", timing);
    navigate(`/request/new?${params.toString()}`);
  };

  return (
    <ServiceShell>
      <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#073f32,#087052)] px-5 py-8 text-white shadow-[0_24px_55px_-35px_rgba(5,68,49,.9)] md:px-10 md:py-12">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black ring-1 ring-white/15"><ShieldCheck className="h-3.5 w-3.5" />مزودون موثقون · ضمان واضح</span>
        <h1 className="relative mt-5 max-w-2xl text-[30px] font-black leading-[1.3] tracking-[-.04em] md:text-5xl">الخدمة التي تحتاجها،<br />بخطوات أقصر وأوضح.</h1>
        <p className="relative mt-3 max-w-xl text-[12px] leading-7 text-white/75 md:text-sm">اختر الخدمة أولًا، سجّل عند التأكيد، ثم تابع العرض والتنفيذ والدفع والضمان من مكان واحد.</p>
        <div className="relative mt-6 grid max-w-lg grid-cols-2 gap-2.5">
          <button onClick={() => start(undefined, "asap")} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-black text-primary shadow-xl"><Zap className="h-4 w-4" />خدمة عاجلة</button>
          <button onClick={() => start(undefined, "scheduled")} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 font-black ring-1 ring-white/20"><CalendarDays className="h-4 w-4" />موعد لاحق</button>
        </div>
      </section>

      <section className="mt-7">
        <div className="relative"><Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث: سباك، تنظيف، تكييف، نقل عفش..." className="h-14 w-full rounded-[20px] border border-[#e5e2d9] bg-white pr-12 pl-4 text-[13px] font-bold outline-none shadow-sm focus:border-primary/40 focus:ring-4 focus:ring-primary/5" /></div>
      </section>

      {!search.trim() && <section className="mt-8"><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black text-primary">استكشف حسب احتياجك</p><h2 className="text-xl font-black">أقسام الخدمة</h2></div>{isLoading && <span className="text-[9px] text-muted-foreground">تحديث الكتالوج...</span>}</div><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{SERVICE_FAMILIES.map((family) => { const count = rows.filter((row) => row.family_code === family.code).length; if (!count) return null; return <button key={family.code} onClick={() => document.getElementById(`family-${family.code}`)?.scrollIntoView({ behavior: "smooth" })} className="overflow-hidden rounded-[24px] border border-[#e5e1d8] bg-white text-right shadow-[0_14px_34px_-29px_rgba(18,70,51,.65)]"><div className="h-[104px] border-b border-[#efede7]"><ServiceVisual family={family.code} /></div><div className="flex items-center justify-between p-3.5"><div><p className="text-[12px] font-black">{family.label}</p><p className="mt-1 text-[9px] text-muted-foreground">{count} خدمات</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf4ef] text-primary"><ArrowLeft className="h-4 w-4" /></span></div></button>; })}</div></section>}

      <section className="mt-9 space-y-8">
        {(search.trim() ? [{ code: "results", label: "نتائج البحث" }] : SERVICE_FAMILIES).map((family) => {
          const services = filtered.filter((item) => search.trim() || item.family_code === family.code);
          if (!services.length) return null;
          return <div id={`family-${family.code}`} key={family.code}><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-[16px] font-black">{family.label}</h2></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{services.map((service) => <button key={service.code} onClick={() => start(service.code)} className={cn("group flex items-center gap-3 overflow-hidden rounded-[22px] border border-[#e7e4dc] bg-white p-2.5 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md")}><div className="h-20 w-24 shrink-0 overflow-hidden rounded-[17px]"><ServiceVisual code={service.code} family={service.family_code} compact /></div><div className="min-w-0 flex-1"><p className="text-[12px] font-black">{service.name_ar}</p><p className="mt-1 line-clamp-2 text-[9.5px] leading-5 text-muted-foreground">{service.description_ar}</p></div><ArrowLeft className="h-4 w-4 shrink-0 text-primary" /></button>)}</div></div>;
        })}
        {!filtered.length && <div className="rounded-3xl border border-dashed p-10 text-center"><p className="font-black">لم نجد خدمة مطابقة</p><button onClick={() => start("other_service")} className="mt-3 text-sm font-bold text-primary">أرسل طلبًا مخصصًا</button></div>}
      </section>
    </ServiceShell>
  );
}
