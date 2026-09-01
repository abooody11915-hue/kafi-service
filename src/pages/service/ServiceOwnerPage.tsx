import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, Banknote, Clock3, ExternalLink, FileCheck2, LayoutDashboard, ShieldCheck, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ServiceShell } from "@/components/service/ServiceShell";
import { EmptyState, MetricCard, PageHeading, SectionHeading, StatusBadge } from "@/components/service/ServiceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatMoney } from "@/lib/servicePresentation";
import { cn } from "@/lib/utils";

type OwnerView = "overview" | "requests" | "providers" | "settlements";

export function ServiceOwnerPage() {
  const { profile } = useAuth();
  const [view, setView] = useState<OwnerView>("overview");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [settlementNotes, setSettlementNotes] = useState<Record<string, string>>({});
  const isPlatform = !!profile?.role?.startsWith("platform_") || ["compliance_reviewer", "finance_operator", "support_agent"].includes(profile?.role ?? "");
  const canReviewProviders = ["platform_owner", "compliance_reviewer"].includes(profile?.role ?? "");
  const canConfirmSettlements = ["platform_owner", "finance_operator"].includes(profile?.role ?? "");

  const dashboard = useQuery({ queryKey: ["service-owner-dashboard"], enabled: isPlatform, queryFn: async () => {
    const [requests, providers, settlements] = await Promise.all([
      (supabase as any).from("maintenance_requests").select("id,ref_no,title,status,priority,created_at,updated_at,service_code,service_catalog(name_ar)").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("maintenance_providers").select("id,user_id,name,business_kind,verification_status,verification_notes,is_active,iban,created_at,provider_documents(doc_type,status,storage_path,review_notes)").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("provider_settlements").select("id,ref_no,total_amount,status,transactions_count,settlement_direction,receipt_storage_path,owner_notes,submitted_at,created_at,maintenance_providers(name)").order("created_at", { ascending: false }).limit(100),
    ]);
    const error = requests.error || providers.error || settlements.error; if (error) throw error;
    return { requests: requests.data as any[], providers: providers.data as any[], settlements: settlements.data as any[] };
  } });

  const review = useMutation({ mutationFn: async ({ providerId, decision }: { providerId: string; decision: "approved" | "needs_completion" | "suspended" }) => {
    const { error } = await (supabase as any).rpc("review_maintenance_provider", { provider_id_input: providerId, decision_input: decision, notes_input: reviewNotes[providerId] || null }); if (error) throw error;
  }, onSuccess: async () => { await dashboard.refetch(); toast.success("تم حفظ قرار التوثيق"); }, onError: (error: Error) => toast.error(error.message === "review_notes_required" ? "اكتب سببًا واضحًا قبل هذا القرار" : error.message) });

  const confirmSettlement = useMutation({ mutationFn: async (settlementId: string) => {
    const { error } = await (supabase as any).rpc("confirm_provider_settlement", { settlement_id_input: settlementId, notes_input: settlementNotes[settlementId] || null }); if (error) throw error;
  }, onSuccess: async () => { await dashboard.refetch(); toast.success("تم اعتماد التسوية وقفل عملياتها"); }, onError: (error: Error) => toast.error(error.message) });

  const openPrivateFile = async (bucket: "provider-documents" | "settlement-receipts", path?: string | null) => {
    if (!path) { toast.error("لا يوجد ملف مرفوع"); return; }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error("تعذر فتح الملف الخاص"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!isPlatform) return <ServiceShell><div className="mx-auto max-w-lg py-12 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-primary/10 text-primary"><ShieldCheck className="h-9 w-9" /></div><h1 className="mt-5 text-2xl font-black">مركز العمليات محمي</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">الوصول يعتمد على عضوية منصة موثقة في قاعدة البيانات، ولا يمكن منحه من الواجهة.</p></div></ServiceShell>;

  const data = dashboard.data ?? { requests: [], providers: [], settlements: [] };
  const pendingProviders = data.providers.filter((provider) => ["pending", "needs_completion", "under_review"].includes(provider.verification_status));
  const activeRequests = data.requests.filter((request) => !["completed", "cancelled", "warranty_resolved"].includes(request.status));
  const openSettlements = data.settlements.filter((settlement) => ["pending_payment", "payment_submitted"].includes(settlement.status));
  const tabs: Array<{ value: OwnerView; label: string; icon: typeof LayoutDashboard; count?: number }> = [
    { value: "overview", label: "نظرة عامة", icon: LayoutDashboard }, { value: "requests", label: "الطلبات", icon: Wrench, count: activeRequests.length },
    { value: "providers", label: "التوثيق", icon: Users, count: pendingProviders.length }, { value: "settlements", label: "التسويات", icon: Banknote, count: openSettlements.length },
  ];

  return <ServiceShell><PageHeading eyebrow="مركز القرار والتشغيل" title="عمليات كافي سيرفس" description="طوابير تشغيل موحدة، قرارات موثقة، وحالة مالية قابلة للتدقيق." />
    <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist">{tabs.map(({ value, label, icon: Icon, count }) => <button key={value} role="tab" aria-selected={view === value} onClick={() => setView(value)} className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black", view === value ? "bg-primary text-white" : "border bg-white text-muted-foreground")}><Icon className="h-4 w-4" />{label}{count !== undefined && <span className={cn("rounded-full px-2 py-0.5 text-xs", view === value ? "bg-white/15" : "bg-muted")}>{count}</span>}</button>)}</div>

    {(view === "overview") && <><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label="طلبات نشطة" value={activeRequests.length} icon={Wrench} /><MetricCard label="بانتظار التوثيق" value={pendingProviders.length} icon={Users} /><MetricCard label="تسويات مفتوحة" value={openSettlements.length} icon={Banknote} /><MetricCard label="طلبات عاجلة" value={activeRequests.filter((request) => ["urgent", "emergency"].includes(request.priority)).length} icon={AlertTriangle} /></div><div className="mt-6 grid gap-4 lg:grid-cols-2"><QueuePreview title="أولوية التشغيل" items={activeRequests.slice(0, 5)} empty="لا توجد طلبات نشطة" onOpen={() => setView("requests")} /><QueuePreview title="توثيق المزودين" items={pendingProviders.slice(0, 5).map((item) => ({ ...item, title: item.name, ref_no: item.business_kind, status: item.verification_status }))} empty="لا توجد ملفات معلقة" onOpen={() => setView("providers")} /></div></>}

    {view === "requests" && <section className="mt-6"><SectionHeading title="الطلبات النشطة" description="مرتبة من الأحدث، مع إبراز الأولوية والحالة الحالية" /><div className="mt-4 space-y-3">{activeRequests.length === 0 ? <EmptyState icon={Wrench} title="لا توجد طلبات نشطة" /> : activeRequests.map((request) => <article key={request.id} className="service-panel flex flex-wrap items-center justify-between gap-4 p-4"><div><span className="text-xs font-black text-primary">طلب #{request.ref_no} · {request.service_catalog?.name_ar ?? request.service_code}</span><h3 className="mt-1 font-black">{request.title}</h3><p className="mt-2 text-xs text-muted-foreground">آخر تحديث {formatDateTime(request.updated_at)}</p></div><div className="flex items-center gap-2"><StatusBadge status={request.status} />{["urgent", "emergency"].includes(request.priority) && <span className="service-status service-status--danger">عاجل</span>}</div></article>)}</div></section>}

    {view === "providers" && <section className="mt-6"><SectionHeading title="توثيق المزودين" description="راجع الوثائق الخاصة وسجل سبب القرار بوضوح" /><div className="mt-4 grid gap-4 lg:grid-cols-2">{pendingProviders.length === 0 ? <EmptyState icon={BadgeCheck} title="لا توجد ملفات معلقة" /> : pendingProviders.map((provider) => <article key={provider.id} className="service-panel p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{provider.name}</h3><p className="mt-1 text-xs text-muted-foreground">{provider.business_kind === "company" ? "منشأة" : "فرد"} · {provider.provider_documents?.length ?? 0} وثائق</p></div><StatusBadge status={provider.verification_status} /></div><div className="mt-4 flex flex-wrap gap-2">{(provider.provider_documents ?? []).map((document: any) => <button key={document.doc_type} onClick={() => void openPrivateFile("provider-documents", document.storage_path)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold"><FileCheck2 className="h-4 w-4 text-primary" />{document.doc_type}<ExternalLink className="h-3.5 w-3.5" /></button>)}</div><Input value={reviewNotes[provider.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [provider.id]: event.target.value }))} placeholder="ملاحظة القرار أو سبب طلب الاستكمال" className="mt-4 h-11" />{canReviewProviders && <div className="mt-3 grid grid-cols-2 gap-2"><Button disabled={review.isPending || provider.verification_status !== "under_review"} onClick={() => review.mutate({ providerId: provider.id, decision: "approved" })}>اعتماد</Button><Button variant="outline" disabled={review.isPending || !(reviewNotes[provider.id]?.trim())} onClick={() => review.mutate({ providerId: provider.id, decision: "needs_completion" })}>طلب استكمال</Button></div>}</article>)}</div></section>}

    {view === "settlements" && <section className="mt-6"><SectionHeading title="التسويات المالية" description="لا يمكن الاعتماد قبل رفع المزود إيصالًا صالحًا" /><div className="mt-4 space-y-3">{openSettlements.length === 0 ? <EmptyState icon={Banknote} title="لا توجد تسويات مفتوحة" /> : openSettlements.map((settlement) => <article key={settlement.id} className="service-panel p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-black">تسوية #{settlement.ref_no}</h3><StatusBadge status={settlement.status} /></div><p className="mt-2 text-xs text-muted-foreground">{settlement.maintenance_providers?.name} · {settlement.transactions_count} عمليات</p></div><strong className="text-xl text-primary">{formatMoney(settlement.total_amount)}</strong></div>{settlement.receipt_storage_path && <Button variant="outline" size="sm" className="mt-4" onClick={() => void openPrivateFile("settlement-receipts", settlement.receipt_storage_path)}><ExternalLink className="ml-2 h-4 w-4" />عرض الإيصال الخاص</Button>}{settlement.status === "payment_submitted" && canConfirmSettlements && <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><Input value={settlementNotes[settlement.id] ?? ""} onChange={(event) => setSettlementNotes((current) => ({ ...current, [settlement.id]: event.target.value }))} placeholder="ملاحظة مالية اختيارية تحفظ في السجل" /><Button disabled={confirmSettlement.isPending || !settlement.receipt_storage_path} onClick={() => confirmSettlement.mutate(settlement.id)}>اعتماد وقفل التسوية</Button></div>}</article>)}</div></section>}
  </ServiceShell>;
}

function QueuePreview({ title, items, empty, onOpen }: { title: string; items: any[]; empty: string; onOpen: () => void }) {
  return <section className="service-panel overflow-hidden"><div className="flex items-center justify-between border-b p-4"><div><p className="service-eyebrow">الأولوية الآن</p><h2 className="text-lg font-black">{title}</h2></div><Clock3 className="text-primary" /></div><div className="divide-y">{items.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">{empty}</p> : items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4"><div><span className="text-xs font-black text-primary">#{item.ref_no}</span><p className="mt-1 text-sm font-black">{item.title}</p></div><StatusBadge status={item.status} /></div>)}</div>{items.length > 0 && <button onClick={onOpen} className="min-h-12 w-full border-t text-sm font-black text-primary">عرض الكل</button>}</section>;
}
