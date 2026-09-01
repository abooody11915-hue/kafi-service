import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarClock, Camera, Check, Loader2, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ServiceShell } from "@/components/service/ServiceShell";
import ServiceVisual from "@/components/services/ServiceVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_CATALOG, SERVICE_FAMILIES, getServiceDefinition } from "@/lib/serviceCatalog";
import { cn } from "@/lib/utils";

type Priority = "normal" | "urgent" | "emergency";
type Timing = "asap" | "scheduled";
type Pricing = "offers" | "price";
type Form = { serviceCode: string; title: string; description: string; city: string; district: string; street: string; buildingNo: string; unitNo: string; locationNote: string; phone: string; priority: Priority; timing: Timing; date: string; time: string; pricing: Pricing; offeredPrice: string };
const EMPTY: Form = { serviceCode: "", title: "", description: "", city: "", district: "", street: "", buildingNo: "", unitNo: "", locationNote: "", phone: "", priority: "normal", timing: "asap", date: "", time: "", pricing: "offers", offeredPrice: "" };
const DRAFT_KEY = "kafi-service.request-draft.v1";
const STEPS = ["الخدمة", "وصف الطلب", "العنوان والموعد", "الدخول الآمن", "المراجعة والمرفقات"];
type CatalogRow = { code: string; family_code: string; name_ar: string; description_ar: string | null; workflow_type: string; after_service_policy: string; supports_offers: boolean; supports_fixed_price: boolean };

export function ServiceRequestPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [family, setFamily] = useState("repair");
  const [form, setForm] = useState<Form>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const { data: catalog = [] } = useQuery({ queryKey: ["service-request-catalog"], queryFn: async () => { const { data, error } = await (supabase as any).rpc("get_customer_service_catalog"); if (error) throw error; return data as CatalogRow[]; } });
  const rows = catalog.length ? catalog : SERVICE_CATALOG.map((service) => ({ code: service.code, family_code: service.family, name_ar: service.label, description_ar: service.description, workflow_type: service.workflow, after_service_policy: service.afterServicePolicy, supports_offers: service.supportsOffers, supports_fixed_price: service.supportsFixedPrice }));

  useEffect(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) setForm({ ...EMPTY, ...JSON.parse(raw) }); } catch { /* ignored */ }
  }, []);
  useEffect(() => {
    const service = params.get("service"); const timing = params.get("timing");
    if (service) { const definition = getServiceDefinition(service); if (definition) { setFamily(definition.family); setForm((current) => ({ ...current, serviceCode: service, title: current.title || definition.label })); } }
    if (timing === "scheduled" || timing === "asap") setForm((current) => ({ ...current, timing }));
  }, [params]);
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignored */ } }, [form]);
  useEffect(() => { if (step === 4 && user) setStep(5); }, [step, user]);

  const selected = rows.find((item) => item.code === form.serviceCode);
  const visible = rows.filter((item) => item.family_code === family);
  const canNext = useMemo(() => {
    if (step === 1) return !!selected;
    if (step === 2) return form.title.trim().length >= 3 && form.description.trim().length >= 10 && (form.pricing === "offers" || Number(form.offeredPrice) > 0);
    if (step === 3) return !!form.city.trim() && !!form.district.trim() && (form.timing === "asap" || (!!form.date && !!form.time));
    if (step === 4) return !!user;
    return true;
  }, [step, selected, form, user]);
  const validationMessage = useMemo(() => {
    if (step === 1 && !selected) return "اختر الخدمة التي تصف احتياجك.";
    if (step === 2 && form.title.trim().length < 3) return "اكتب عنوانًا مختصرًا من 3 أحرف على الأقل.";
    if (step === 2 && form.description.trim().length < 10) return "أضف وصفًا أوضح من 10 أحرف لمساعدة المزود على التسعير.";
    if (step === 2 && form.pricing === "price" && Number(form.offeredPrice) <= 0) return "أدخل ميزانية مقترحة صحيحة.";
    if (step === 3 && !form.city.trim()) return "اكتب المدينة.";
    if (step === 3 && !form.district.trim()) return "اكتب الحي.";
    if (step === 3 && form.timing === "scheduled" && (!form.date || !form.time)) return "حدد تاريخ الموعد ووقته.";
    return null;
  }, [step, selected, form]);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const accepted = Array.from(event.target.files ?? []).filter((file) => /^(image|video|audio)\//.test(file.type) && file.size <= 20 * 1024 * 1024);
    setFiles((current) => [...current, ...accepted].slice(0, 6));
    event.target.value = "";
  };

  const create = useMutation({ mutationFn: async () => {
    if (!user || !selected) throw new Error("سجل الدخول واختر الخدمة");
    const { data, error } = await (supabase as any).rpc("create_maintenance_request_atomic", {
      service_code_input: selected.code, title_input: form.title.trim(), description_input: form.description.trim(),
      address_input: { city: form.city.trim(), district: form.district.trim(), street: form.street.trim(), building_no: form.buildingNo.trim(), unit_no: form.unitNo.trim(), label: "عنوان الطلب" },
      priority_input: form.priority, pricing_mode_input: form.pricing,
      offered_price_input: form.pricing === "price" ? Number(form.offeredPrice) : null,
      timing_mode_input: form.timing, scheduled_date_input: form.timing === "scheduled" ? form.date : null,
      scheduled_time_input: form.timing === "scheduled" ? form.time : null,
      location_note_input: form.locationNote.trim() || null, contact_phone_input: form.phone.trim() || null,
      service_metadata_input: { service_label: selected.name_ar, family: selected.family_code }, idempotency_key_input: idempotencyKey.current,
    });
    if (error) throw error;
    const request = data as { id: string };
    const failed: string[] = [];
    for (const file of files) {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "audio";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${request.id}/${crypto.randomUUID()}-${safeName}`;
      const uploaded = await supabase.storage.from("maintenance-media").upload(path, file, { contentType: file.type, upsert: false });
      if (uploaded.error) { failed.push(file.name); continue; }
      const inserted = await (supabase as any).from("maintenance_request_media").insert({ request_id: request.id, uploaded_by: user.id, media_kind: kind, storage_path: path, mime_type: file.type || null, size_bytes: file.size });
      if (inserted.error) failed.push(file.name);
    }
    return { id: request.id, failed };
  }, onSuccess: ({ id, failed }) => { localStorage.removeItem(DRAFT_KEY); idempotencyKey.current = crypto.randomUUID(); setCreatedId(id); if (failed.length) toast.warning(`تم إنشاء الطلب، وتعذر رفع ${failed.length} مرفق`); else toast.success("تم إرسال طلبك بنجاح"); }, onError: (error: Error) => toast.error(error.message) });

  if (createdId) return <ServiceShell><div className="mx-auto max-w-lg py-10 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-primary/10 text-primary"><Check className="h-9 w-9" /></div><h1 className="mt-5 text-2xl font-black">تم استلام طلبك</h1><p className="mt-2 text-sm leading-7 text-muted-foreground">بدأ سجل التتبع، وسيظهر أي عرض أو تحديث فورًا داخل طلباتك.</p><Button onClick={() => navigate("/requests")} className="mt-6 h-12 rounded-xl px-8 font-black">متابعة الطلب</Button></div></ServiceShell>;

  return <ServiceShell compact><div className="mx-auto max-w-2xl">
    <div className="mb-5"><p className="service-eyebrow">طلب خدمة جديد</p><h1 className="service-page-title">{STEPS[step - 1]}</h1><div className="mt-4 grid grid-cols-5 gap-1.5">{STEPS.map((_, index) => <div key={index} className={cn("h-1.5 rounded-full", index < step ? "bg-primary" : "bg-muted")} />)}</div><p className="mt-2 text-xs text-muted-foreground">الخطوة {step} من 5</p></div>
    <section className="rounded-[28px] border border-[#e5e2d9] bg-white p-4 shadow-[0_20px_55px_-45px_rgba(5,68,49,.7)] md:p-6">
      {step === 1 && <div><div className="flex gap-2 overflow-x-auto pb-3">{SERVICE_FAMILIES.map((item) => <button key={item.code} onClick={() => setFamily(item.code)} className={cn("shrink-0 rounded-full px-3 py-2 text-[10px] font-black", family === item.code ? "bg-primary text-white" : "bg-secondary")}>{item.label}</button>)}</div><div className="grid gap-2 md:grid-cols-2">{visible.map((service) => <button key={service.code} onClick={() => { update("serviceCode", service.code); if (!form.title) update("title", service.name_ar); }} className={cn("flex items-center gap-3 rounded-[20px] border p-2 text-right", form.serviceCode === service.code ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-[#ece9e2]")}><div className="h-16 w-20 overflow-hidden rounded-[15px]"><ServiceVisual code={service.code} family={service.family_code} compact /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{service.name_ar}</p><p className="mt-1 line-clamp-2 text-[8.5px] text-muted-foreground">{service.description_ar}</p></div>{form.serviceCode === service.code && <Check className="h-4 w-4 text-primary" />}</button>)}</div></div>}
      {step === 2 && <div className="space-y-5"><div><label className="text-sm font-black">عنوان مختصر</label><Input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={160} className="mt-2 h-12 rounded-xl text-base" placeholder="مثال: المكيف لا يبرد" /></div><div><label className="text-sm font-black">صف المشكلة كما تراها</label><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={1500} rows={5} className="mt-2 resize-none rounded-xl text-base" placeholder="متى بدأت؟ ماذا جرّبت؟ وهل يوجد تسرب أو صوت؟" /><p className="mt-1 text-xs text-muted-foreground">{form.description.length}/1500</p></div><div><label className="text-sm font-black">الأولوية</label><div className="mt-2 grid grid-cols-3 gap-2">{([['normal','عادي'],['urgent','عاجل'],['emergency','طارئ']] as const).map(([value,label]) => <button key={value} onClick={() => update("priority", value)} className={cn("min-h-11 rounded-xl text-sm font-black", form.priority === value ? "bg-primary text-white" : "bg-secondary")}>{label}</button>)}</div></div><div><label className="text-sm font-black">طريقة التسعير</label><p className="mt-1 text-xs leading-5 text-muted-foreground">يمكنك استقبال عروض متعددة أو اقتراح ميزانية مبدئية.</p><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => update("pricing", "offers")} className={cn("min-h-12 rounded-xl px-2 text-sm font-black", form.pricing === "offers" ? "bg-primary text-white" : "bg-secondary")}>استقبال عروض</button><button disabled={!selected?.supports_fixed_price} onClick={() => update("pricing", "price")} className={cn("min-h-12 rounded-xl px-2 text-sm font-black disabled:opacity-40", form.pricing === "price" ? "bg-primary text-white" : "bg-secondary")}>ميزانية مقترحة</button></div>{form.pricing === "price" && <div className="relative mt-3"><Input type="number" min="1" inputMode="decimal" value={form.offeredPrice} onChange={(event) => update("offeredPrice", event.target.value)} className="h-12 rounded-xl pl-16 text-base" placeholder="0" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">ر.س</span></div>}</div></div>}
      {step === 3 && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-black">المدينة</label><Input value={form.city} onChange={(event) => update("city", event.target.value)} className="mt-2 h-12 rounded-xl text-base" /></div><div><label className="text-[11px] font-black">الحي</label><Input value={form.district} onChange={(event) => update("district", event.target.value)} className="mt-2 h-12 rounded-xl text-base" /></div></div><div><label className="text-[11px] font-black">الشارع</label><Input value={form.street} onChange={(event) => update("street", event.target.value)} className="mt-2 h-12 rounded-xl text-base" /></div><div className="grid grid-cols-2 gap-3"><Input value={form.buildingNo} onChange={(event) => update("buildingNo", event.target.value)} placeholder="رقم المبنى" className="h-12 rounded-xl text-base" /><Input value={form.unitNo} onChange={(event) => update("unitNo", event.target.value)} placeholder="رقم الوحدة (اختياري)" className="h-12 rounded-xl text-base" /></div><div><label className="text-[11px] font-black">وصف الوصول للموقع</label><Input value={form.locationNote} onChange={(event) => update("locationNote", event.target.value)} placeholder="علامة مميزة، مدخل، دور..." className="mt-2 h-12 rounded-xl text-base" /></div><div className="grid grid-cols-2 gap-2"><button onClick={() => update("timing", "asap")} className={cn("h-12 rounded-xl text-[11px] font-black", form.timing === "asap" ? "bg-primary text-white" : "bg-secondary")}>في أسرع وقت</button><button onClick={() => update("timing", "scheduled")} className={cn("h-12 rounded-xl text-[11px] font-black", form.timing === "scheduled" ? "bg-primary text-white" : "bg-secondary")}>موعد لاحق</button></div>{form.timing === "scheduled" && <div className="grid grid-cols-2 gap-3"><Input type="date" value={form.date} min={new Date().toISOString().slice(0,10)} onChange={(event) => update("date", event.target.value)} className="h-12 rounded-xl" /><Input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} className="h-12 rounded-xl" /></div>}</div>}
      {step === 4 && <div className="py-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck /></div><h2 className="mt-4 text-xl font-black">احفظ طلبك وتابعه بأمان</h2><p className="mx-auto mt-2 max-w-sm text-[10.5px] leading-6 text-muted-foreground">بيانات الطلب محفوظة كمسودة على جهازك. سجّل بالبريد، ثم ستعود مباشرة إلى المراجعة وإضافة الصور.</p>{user ? <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-black text-primary"><Check className="h-4 w-4" />تم تسجيل الدخول</p> : <Button onClick={() => navigate(`/auth?next=${encodeURIComponent("/request/new")}`)} className="mt-5 h-12 rounded-xl px-7 font-black">تسجيل الدخول وإكمال الطلب</Button>}</div>}
      {step === 5 && <div className="space-y-4"><div className="rounded-2xl bg-[#f7f5ee] p-4"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><strong className="text-[11px]">{form.city} · {form.district}</strong></div><p className="mt-2 text-[10px] leading-5 text-muted-foreground">{selected?.name_ar} — {form.title}</p><p className="mt-1 text-[9px] text-muted-foreground"><CalendarClock className="ml-1 inline h-3 w-3" />{form.timing === "asap" ? "في أسرع وقت" : `${form.date} · ${form.time}`}</p></div><div><label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-[10px] font-black text-primary"><Camera className="mb-2 h-5 w-5" />أضف صورًا أو فيديو أو تسجيلًا صوتيًا<input type="file" multiple accept="image/*,video/mp4,audio/*" className="hidden" onChange={addFiles} /></label>{files.length > 0 && <div className="mt-2 space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-[9px]"><span className="truncate">{file.name}</span><button onClick={() => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`حذف ${file.name}`}><Trash2 className="h-4 w-4 text-destructive" /></button></div>)}</div>}</div><div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[9px] leading-5 text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />السعر النهائي لا يعتمد إلا بعد موافقتك، والمرفقات خاصة ولا تظهر إلا لأطراف الطلب.</div></div>}
      {!canNext && validationMessage && step < 5 && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800"><AlertCircle className="ml-2 inline h-4 w-4" />{validationMessage}</p>}
    </section>
    <div className="mt-4 flex gap-2"><Button variant="outline" disabled={step === 1 || create.isPending} onClick={() => setStep((current) => Math.max(1, current - 1))} className="h-12 rounded-xl px-5"><ArrowRight className="ml-1 h-4 w-4" />السابق</Button>{step < 5 ? <Button disabled={!canNext} onClick={() => { if (step === 3 && !user) setStep(4); else setStep((current) => Math.min(5, current + 1)); }} className="h-12 flex-1 rounded-xl font-black">التالي<ArrowLeft className="mr-1 h-4 w-4" /></Button> : <Button disabled={create.isPending} onClick={() => create.mutate()} className="h-12 flex-1 rounded-xl font-black">{create.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Check className="ml-2 h-4 w-4" />}تأكيد وإرسال الطلب</Button>}</div>
  </div></ServiceShell>;
}
