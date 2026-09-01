export const TERMINAL_MAINTENANCE_STATUSES = new Set(["completed", "cancelled", "warranty_resolved"]);

export const PROVIDER_TRANSITIONS: Record<string, { target: string; label: string }> = {
  accepted: { target: "arrived", label: "تأكيد الوصول" },
  arrived: { target: "in_progress", label: "بدء العمل" },
  in_progress: { target: "waiting_confirmation", label: "إنهاء العمل وطلب التأكيد" },
  warranty_requested: { target: "warranty_in_progress", label: "بدء معالجة الضمان" },
  warranty_in_progress: { target: "warranty_waiting_confirmation", label: "إنهاء معالجة الضمان" },
};

export function isTerminalMaintenanceStatus(status: string) {
  return TERMINAL_MAINTENANCE_STATUSES.has(status);
}

export function canCustomerCancel(status: string) {
  return status === "new";
}

export function canCustomerReschedule(status: string) {
  return status === "new" || status === "accepted";
}

export function getProviderNextTransition(status: string) {
  return PROVIDER_TRANSITIONS[status] ?? null;
}
