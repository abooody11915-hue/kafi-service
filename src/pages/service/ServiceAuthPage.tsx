import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ServiceShell } from "@/components/service/ServiceShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function ServiceAuthPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/requests";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) navigate(next, { replace: true }); }, [user, navigate, next]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const redirect = `${window.location.origin}${next}`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect, shouldCreateUser: true },
    });
    setBusy(false);
    if (authError) { setError(authError.message); return; }
    setSent(true);
  };

  return <ServiceShell compact><div className="mx-auto max-w-md py-8">
    <div className="service-panel p-6 md:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Mail /></div>
      <h1 className="mt-5 text-center text-2xl font-black">دخول سريع وآمن</h1>
      <p className="mt-2 text-center text-sm leading-7 text-muted-foreground">لا تحتاج إلى كلمة مرور. نرسل رابط دخول لمرة واحدة، ثم تعود تلقائيًا لإكمال ما بدأت.</p>
      {!sent ? <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-black" htmlFor="service-email">البريد الإلكتروني</label><Input id="service-email" dir="ltr" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 rounded-xl text-base" />{error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">تعذر إرسال الرابط. تحقق من البريد وحاول مرة أخرى.</p>}<Button disabled={busy} className="h-12 w-full rounded-xl font-black">{busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Mail className="ml-2 h-4 w-4" />}إرسال رابط الدخول</Button></form> : <div className="mt-6 rounded-2xl bg-primary/5 p-5 text-center" role="status"><CheckCircle2 className="mx-auto h-7 w-7 text-primary" /><p className="mt-2 text-base font-black">تم إرسال الرابط</p><p className="mt-1 text-sm leading-6 text-muted-foreground">افتح الرسالة على هذا الجهاز واضغط الرابط. تحقق من البريد غير المرغوب إن لم تجدها.</p><button onClick={() => setSent(false)} className="mt-4 text-sm font-bold text-primary">استخدام بريد آخر</button></div>}
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f7f5ee] p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />لن ننشئ طلبًا أو نحفظ عنوانك في قاعدة البيانات قبل دخولك وموافقتك النهائية.</div>
      <Link to="/" className="mt-5 block min-h-11 py-3 text-center text-sm font-bold text-primary">العودة للخدمات</Link>
    </div>
  </div></ServiceShell>;
}
