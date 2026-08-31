import { describe, expect, it } from "vitest";
import { canTransition } from "./request-state";

describe("request state machine", () => {
  it("allows the normal intake path", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
    expect(canTransition("submitted", "triaged")).toBe(true);
  });

  it("blocks skipping execution states", () => {
    expect(canTransition("submitted", "completed")).toBe(false);
    expect(canTransition("assigned", "work_completed")).toBe(false);
  });

  it("keeps terminal states terminal", () => {
    expect(canTransition("cancelled", "submitted")).toBe(false);
    expect(canTransition("expired", "submitted")).toBe(false);
  });
});
