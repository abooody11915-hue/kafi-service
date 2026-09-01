export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const STATUS_LABELS: Record<string, string> = {
  new: "بانتظار العروض", pending: "قيد الانتظار", accepted: "تم اختيار المزود",
  arrived: "وصل المزود", in_progress: "جارٍ التنفيذ", waiting_confirmation: "بانتظار تأكيد العميل",
  waiting_payment: "بانتظار الدفع", payment_submitted: "تم تسجيل الدفع", pending_payment: "مستحقة الدفع",
  completed: "مكتمل", cancelled: "ملغي", inactive: "متوقف مؤقتًا", under_review: "تحت المراجعة",
  approved: "موثق ونشط", rejected: "مرفوض", needs_completion: "يحتاج استكمالًا", suspended: "موقوف",
  warranty_requested: "طلب الضمان مفتوح", warranty_in_progress: "جارٍ معالجة الضمان",
  warranty_waiting_confirmation: "بانتظار تأكيد حل الضمان", warranty_resolved: "تم حل الضمان",
  warranty_rejected: "الضمان مرفوض",
};

const SUCCESS = new Set(["approved", "completed", "warranty_resolved"]);
const DANGER = new Set(["cancelled", "rejected", "suspended", "warranty_rejected"]);
const WARNING = new Set(["pending", "new", "waiting_confirmation", "waiting_payment", "pending_payment", "payment_submitted", "under_review", "needs_completion", "warranty_requested", "warranty_waiting_confirmation"]);
const INFO = new Set(["accepted", "arrived", "in_progress", "warranty_in_progress"]);

export function statusLabel(status?: string | null) {
  if (!status) return "غير محدد";
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function statusTone(status?: string | null): StatusTone {
  if (!status) return "neutral";
  if (SUCCESS.has(status)) return "success";
  if (DANGER.has(status)) return "danger";
  if (WARNING.has(status)) return "warning";
  if (INFO.has(status)) return "info";
  return "neutral";
}

export function formatMoney(value?: number | string | null) {
  return `${Number(value ?? 0).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
