export const requestStates = [
  "draft",
  "submitted",
  "triaged",
  "quoting",
  "customer_confirmed",
  "assigned",
  "scheduled",
  "en_route",
  "arrived",
  "in_progress",
  "work_completed",
  "awaiting_customer_acceptance",
  "completed",
  "cancelled",
  "expired",
  "disputed",
  "rework_required",
  "on_hold",
] as const;

export type RequestState = (typeof requestStates)[number];

const allowedTransitions: Record<RequestState, readonly RequestState[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["triaged", "cancelled", "expired"],
  triaged: ["quoting", "assigned", "on_hold", "cancelled"],
  quoting: ["customer_confirmed", "expired", "cancelled"],
  customer_confirmed: ["assigned", "cancelled"],
  assigned: ["scheduled", "on_hold", "cancelled"],
  scheduled: ["en_route", "on_hold", "cancelled"],
  en_route: ["arrived", "on_hold"],
  arrived: ["in_progress", "on_hold"],
  in_progress: ["work_completed", "on_hold"],
  work_completed: ["awaiting_customer_acceptance", "rework_required"],
  awaiting_customer_acceptance: ["completed", "disputed", "rework_required"],
  completed: ["disputed", "rework_required"],
  cancelled: [],
  expired: [],
  disputed: ["completed", "rework_required"],
  rework_required: ["assigned", "scheduled"],
  on_hold: ["triaged", "assigned", "scheduled", "in_progress", "cancelled"],
};

export function canTransition(from: RequestState, to: RequestState) {
  return allowedTransitions[from].includes(to);
}
