import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/servicePresentation";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl">
    {eyebrow && <p className="service-eyebrow">{eyebrow}</p>}<h1 className="service-page-title">{title}</h1>
    {description && <p className="service-page-description">{description}</p>}
  </div>{action}</div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-3"><div><h2 className="service-section-title">{title}</h2>{description && <p className="service-section-description">{description}</p>}</div>{action}</div>;
}

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  return <span className={cn("service-status", `service-status--${statusTone(status)}`)}>{label ?? statusLabel(status)}</span>;
}

export function MetricCard({ label, value, icon: Icon, hint }: { label: string; value: React.ReactNode; icon: LucideIcon; hint?: string }) {
  return <article className="service-metric-card"><span className="service-icon-box"><Icon aria-hidden="true" /></span><strong>{value}</strong><span>{label}</span>{hint && <small>{hint}</small>}</article>;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description?: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return <div className="service-empty-state"><span className="service-empty-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3>{description && <p>{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function LoadingState({ label = "جاري تحميل البيانات" }: { label?: string }) {
  return <div className="service-loading" role="status"><Loader2 className="animate-spin" aria-hidden="true" /><span>{label}</span></div>;
}
