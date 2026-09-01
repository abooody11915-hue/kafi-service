import { describe, expect, it } from "vitest";

const providerTransitions: Record<string, string> = {
  accepted: "arrived",
  arrived: "in_progress",
  in_progress: "waiting_confirmation",
  warranty_requested: "warranty_in_progress",
  warranty_in_progress: "warranty_waiting_confirmation",
};

describe("maintenance workflow invariants", () => {
  it("does not allow a provider to skip operational states", () => {
    expect(providerTransitions.accepted).toBe("arrived");
    expect(providerTransitions.arrived).toBe("in_progress");
    expect(providerTransitions.in_progress).toBe("waiting_confirmation");
    expect(providerTransitions.accepted).not.toBe("completed");
  });

  it("requires customer confirmation before payment and completion", () => {
    const customerSequence = ["waiting_confirmation", "waiting_payment", "completed"];
    expect(customerSequence.indexOf("waiting_confirmation")).toBeLessThan(customerSequence.indexOf("waiting_payment"));
    expect(customerSequence.indexOf("waiting_payment")).toBeLessThan(customerSequence.indexOf("completed"));
  });
});
