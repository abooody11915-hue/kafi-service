import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone } from "@/lib/phone";

describe("normalizeSaudiPhone", () => {
  it.each([
    ["0512345678", "0512345678", "+966512345678"],
    ["512345678", "0512345678", "+966512345678"],
    ["+966 51 234 5678", "0512345678", "+966512345678"],
  ])("normalizes %s", (input, local, e164) => {
    expect(normalizeSaudiPhone(input)).toEqual({ local, e164 });
  });

  it.each(["", "123", "0612345678", "+971501234567"])("rejects %s", (input) => {
    expect(normalizeSaudiPhone(input)).toBeNull();
  });
});
