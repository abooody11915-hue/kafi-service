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
    <div className="rounded-[30px] border border-[#e5e2d9] bg-white p-6 shadow-[0_24px_60px_-42px_rgba(5,68,49,.7)]">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Mail /></div>
      <h1 className="mt-5 text-center text-2xl font-black">دخول سريع وآمن</h1>
      <p className="mt-2 text-center text-[11px] leading-6 text-muted-foreground">لا كلمة مرور. نرسل رابط دخول لمرة واحدة إلى بريدك، ثم تعود لإكمال طلبك.</p>
      {!sent ? <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-[11px] font-black">البريد الإلكتروني</label><Input dir="ltr" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 rounded-xl text-base" />{error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-[10px] font-bold text-destructive">{error}</p>}<Button disabled={busy} className="h-12 w-full rounded-xl font-black">{busy ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Mail className="ml-2 h-4 w-4" />}إرسال رابط الدخول</Button></form> : <div className="mt-6 rounded-2xl bg-primary/5 p-5 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-primary" /><p className="mt-2 text-sm font-black">تم إرسال الرابط</p><p className="mt-1 text-[10px] leading-5 text-muted-foreground">افتح الرسالة على هذا الجهاز واضغط الرابط. قد تصل إلى البريد غير المرغوب.</p><button onClick={() => setSent(false)} className="mt-4 text-[11px] font-bold text-primary">استخدام بريد آخر</button></div>}
      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f7f5ee] p-3 text-[9.5px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />لن ننشئ طلبًا أو نحفظ عنوانك قبل تسجيل الدخول والموافقة النهائية.</div>
      <Link to="/" className="mt-5 block text-center text-[11px] font-bold text-primary">العودة للخدمات</Link>
    </div>
  </div></ServiceShell>;
}
