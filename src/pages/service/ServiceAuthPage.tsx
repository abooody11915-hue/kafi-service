import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ServiceShell } from "@/components/service/ServiceShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSaudiPhone } from "@/lib/phone";

export function ServiceAuthPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/requests";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => { if (user) navigate(next, { replace: true }); }, [user, navigate, next]);
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(() => setOtpCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const redirect = `${window.location.origin}${next}`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect, shouldCreateUser: true },
    });
    setBusy(false);
    if (authError) { setError("تعذر إرسال الرابط. تحقق من البريد وحاول مرة أخرى."); return; }
    setSent(true);
  };

  const sendOtp = async () => {
    const normalized = normalizeSaudiPhone(phone);
    if (!normalized) { setError("أدخل رقم جوال سعوديًا صحيحًا."); return; }
    setOtpBusy(true); setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke("authentica-phone-otp", {
      body: { action: "send", phone: normalized.e164 },
    });
    setOtpBusy(false);
    if (invokeError || data?.error) {
      setError(data?.error === "otp_not_configured" ? "خدمة رمز التحقق غير مهيأة حاليًا." : "تعذر إرسال رمز التحقق. حاول مرة أخرى.");
      return;
    }
    setOtpSent(true); setOtpCooldown(60);
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeSaudiPhone(phone);
    const token = otp.replace(/\D/g, "").slice(0, 6);
    if (!normalized || token.length !== 6) { setError("أدخل رمز التحقق المكوّن من 6 أرقام."); return; }
    setOtpBusy(true); setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke("authentica-phone-otp", {
      body: { action: "verify", phone: normalized.e164, code: token },
    });
    if (invokeError || data?.error || !data?.token_hash) {
      setOtpBusy(false); setError("رمز التحقق غير صحيح أو انتهت صلاحيته."); return;
    }
    const { error: sessionError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "email" });
    setOtpBusy(false);
    if (sessionError) setError("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.");
  };

  return <ServiceShell compact><div className="mx-auto max-w-md py-8">
    <div className="service-panel p-6 md:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck /></div>
      <h1 className="mt-5 text-center text-2xl font-black">دخول سريع وآمن</h1>
      <p className="mt-2 text-center text-sm leading-7 text-muted-foreground">استخدم رمز تحقق على جوالك المسجل، أو استمر عبر رابط البريد الإلكتروني.</p>

      <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex items-start gap-3"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-sm font-black">الدخول برمز تحقق</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">متاح للحسابات التي لديها رقم جوال مسجل في كافي.</p></div></div>
        {!otpSent ? <div className="mt-4 space-y-3"><Input dir="ltr" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="05xxxxxxxx" className="h-12 rounded-xl text-base" /><Button type="button" onClick={sendOtp} disabled={otpBusy} className="h-12 w-full rounded-xl font-black">{otpBusy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="ml-2 h-4 w-4" />}إرسال رمز التحقق</Button></div> : <form onSubmit={verifyOtp} className="mt-4 space-y-3"><Input aria-label="رمز التحقق" dir="ltr" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="h-12 rounded-xl text-center text-lg tracking-[0.35em]" /><Button disabled={otpBusy || otp.length !== 6} className="h-12 w-full rounded-xl font-black">{otpBusy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تأكيد الرمز والدخول</Button><Button type="button" variant="ghost" onClick={sendOtp} disabled={otpBusy || otpCooldown > 0} className="h-10 w-full rounded-xl text-xs font-bold"><RotateCcw className="ml-2 h-4 w-4" />{otpCooldown > 0 ? `إعادة الإرسال بعد ${otpCooldown}ث` : "إعادة إرسال الرمز"}</Button></form>}
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>أو عبر البريد</span><span className="h-px flex-1 bg-border" /></div>
      {!sent ? <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-black" htmlFor="service-email">البريد الإلكتروني</label><Input id="service-email" dir="ltr" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 rounded-xl text-base" /><Button disabled={busy} className="h-12 w-full rounded-xl font-black">{busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Mail className="ml-2 h-4 w-4" />}إرسال رابط الدخول</Button></form> : <div className="rounded-2xl bg-primary/5 p-5 text-center" role="status"><CheckCircle2 className="mx-auto h-7 w-7 text-primary" /><p className="mt-2 text-base font-black">تم إرسال الرابط</p><p className="mt-1 text-sm leading-6 text-muted-foreground">افتح الرسالة على هذا الجهاز واضغط الرابط. تحقق من البريد غير المرغوب إن لم تجدها.</p><button onClick={() => setSent(false)} className="mt-4 text-sm font-bold text-primary">استخدام بريد آخر</button></div>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>}
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f7f5ee] p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />لن ننشئ طلبًا أو نحفظ عنوانك في قاعدة البيانات قبل دخولك وموافقتك النهائية.</div>
      <Link to="/" className="mt-5 block min-h-11 py-3 text-center text-sm font-bold text-primary">العودة للخدمات</Link>
    </div>
  </div></ServiceShell>;
}
