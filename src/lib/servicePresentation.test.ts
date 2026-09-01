import { describe, expect, it } from "vitest";
import { formatMoney, statusLabel, statusTone } from "./servicePresentation";

describe("service presentation", () => {
  it("translates operational statuses for Arabic users", () => {
    expect(statusLabel("in_progress")).toBe("جارٍ التنفيذ");
    expect(statusLabel("needs_completion")).toBe("يحتاج استكمالًا");
  });

  it("maps statuses to consistent semantic tones", () => {
    expect(statusTone("completed")).toBe("success");
    expect(statusTone("cancelled")).toBe("danger");
    expect(statusTone("under_review")).toBe("warning");
  });

  it("formats Saudi currency consistently", () => {
    expect(formatMoney(1250)).toContain("ر.س");
  });
});
