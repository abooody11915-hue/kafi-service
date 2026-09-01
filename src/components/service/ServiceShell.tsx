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
    { to: "/provider", label: "المزود", icon: Store },
    ...(isPlatform ? [{ to: "/owner", label: "الأونر", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf6] text-foreground" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,#064a38_0%,#087252_50%,#0e7557_100%)] text-white shadow-[0_16px_36px_-30px_rgba(5,68,49,.8)]">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20"><Wrench className="h-5 w-5" /></span>
            <span><strong className="block text-[15px] font-black">كافي سيرفس</strong><small className="text-[9px] text-white/70">خدمة موثوقة من الطلب إلى الضمان</small></span>
          </Link>
          {user ? (
            <button type="button" onClick={async () => { await signOut(); navigate("/"); }} className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-[11px] font-bold ring-1 ring-white/15"><LogOut className="h-4 w-4" />خروج</button>
          ) : (
            <Link to="/auth" className="flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-[11px] font-black text-primary"><LogIn className="h-4 w-4" />دخول</Link>
          )}
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-6xl px-4", compact ? "py-5" : "py-7", "pb-28")}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex min-h-[70px] items-center justify-around rounded-t-[28px] border border-white/70 bg-white/95 px-2 shadow-[0_-10px_38px_-24px_rgba(10,60,44,.35)] backdrop-blur-xl">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return <Link key={to} to={to} className={cn("mx-1 flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] py-2 text-[10px] font-bold", active ? "bg-primary text-white" : "text-muted-foreground")}><Icon className="h-5 w-5" /><span>{label}</span></Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
