import { Home, LogIn, LogOut, ShieldCheck, Store, Wrench } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function ServiceShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPlatform = !!profile?.role?.startsWith("platform_") || ["compliance_reviewer", "finance_operator", "support_agent"].includes(profile?.role ?? "");
  const links = [
    { to: "/", label: "الخدمات", icon: Home },
    { to: "/requests", label: "طلباتي", icon: Wrench },
    { to: "/provider", label: "بوابة المزود", shortLabel: "المزود", icon: Store },
    ...(isPlatform ? [{ to: "/owner", label: "مركز العمليات", shortLabel: "الأونر", icon: ShieldCheck }] : []),
  ];
  const isActive = (to: string) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return <div className="min-h-[100dvh] bg-[var(--service-canvas)] text-foreground" dir="rtl">
    <a href="#main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 font-bold text-primary focus:not-sr-only focus:fixed focus:right-4 focus:top-4">انتقل إلى المحتوى</a>
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,var(--service-brand-strong),var(--service-brand))] text-white shadow-[0_12px_32px_-26px_rgba(5,68,49,.85)]">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link to="/" aria-label="العودة إلى خدمات كافي سيرفس" className="flex items-center gap-3 rounded-xl focus-visible:outline-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20"><Wrench className="h-5 w-5" aria-hidden="true" /></span>
          <span><strong className="block text-base font-black">كافي سيرفس</strong><small className="block text-xs text-white/75">خدمة موثوقة حتى الضمان</small></span>
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={isActive(to) ? "page" : undefined} className={cn("flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors", isActive(to) ? "bg-white text-primary" : "text-white/80 hover:bg-white/10 hover:text-white")}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>)}
        </nav>
        {user ? <button type="button" onClick={async () => { await signOut(); navigate("/"); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-bold ring-1 ring-white/15 transition hover:bg-white/15"><LogOut className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">تسجيل الخروج</span></button>
          : <Link to="/auth" className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-primary"><LogIn className="h-4 w-4" aria-hidden="true" />دخول</Link>}
      </div>
    </header>
    <main id="main-content" className={cn("mx-auto w-full max-w-6xl px-4 lg:px-6", compact ? "py-5" : "py-7 md:py-9", "pb-28 md:pb-10")}>{children}</main>
    <nav aria-label="التنقل الرئيسي للجوال" data-bottom-nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-3 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex min-h-[72px] items-center justify-around rounded-t-[24px] border border-white/70 bg-white/95 px-2 shadow-[0_-10px_38px_-24px_rgba(10,60,44,.35)] backdrop-blur-xl">
        {links.map(({ to, label, shortLabel, icon: Icon }) => <Link key={to} to={to} aria-current={isActive(to) ? "page" : undefined} className={cn("mx-1 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-bold transition-colors", isActive(to) ? "bg-primary text-white" : "text-muted-foreground")}><Icon className="h-5 w-5" aria-hidden="true" /><span className="truncate">{shortLabel ?? label}</span></Link>)}
      </div>
    </nav>
  </div>;
}
