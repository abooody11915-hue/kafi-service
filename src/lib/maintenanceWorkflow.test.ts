import { describe, expect, it } from "vitest";
import { canCustomerCancel, canCustomerReschedule, getProviderNextTransition, isTerminalMaintenanceStatus } from "./maintenanceWorkflow";

describe("maintenance workflow invariants", () => {
  it("does not allow a provider to skip operational states", () => {
    expect(getProviderNextTransition("accepted")?.target).toBe("arrived");
    expect(getProviderNextTransition("arrived")?.target).toBe("in_progress");
    expect(getProviderNextTransition("in_progress")?.target).toBe("waiting_confirmation");
    expect(getProviderNextTransition("accepted")?.target).not.toBe("completed");
  });

  it("requires customer confirmation before payment and completion", () => {
    const customerSequence = ["waiting_confirmation", "waiting_payment", "completed"];
    expect(customerSequence.indexOf("waiting_confirmation")).toBeLessThan(customerSequence.indexOf("waiting_payment"));
    expect(customerSequence.indexOf("waiting_payment")).toBeLessThan(customerSequence.indexOf("completed"));
  });

  it("limits customer cancellation and rescheduling to safe states", () => {
    expect(canCustomerCancel("new")).toBe(true);
    expect(canCustomerCancel("accepted")).toBe(false);
    expect(canCustomerReschedule("new")).toBe(true);
    expect(canCustomerReschedule("accepted")).toBe(true);
    expect(canCustomerReschedule("arrived")).toBe(false);
  });

  it("classifies only completed lifecycles as terminal", () => {
    expect(isTerminalMaintenanceStatus("completed")).toBe(true);
    expect(isTerminalMaintenanceStatus("cancelled")).toBe(true);
    expect(isTerminalMaintenanceStatus("warranty_resolved")).toBe(true);
    expect(isTerminalMaintenanceStatus("waiting_payment")).toBe(false);
  });
});
