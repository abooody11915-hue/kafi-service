import { describe, expect, it } from "vitest";
import { SERVICE_CATALOG, SERVICE_FAMILIES, getServiceDefinition, getServicesByFamily } from "./serviceCatalog";

describe("KAFI 2 extracted service catalog", () => {
  it("keeps the complete 26-service catalog without duplicate codes", () => {
    expect(SERVICE_CATALOG).toHaveLength(26);
    expect(new Set(SERVICE_CATALOG.map((service) => service.code)).size).toBe(26);
  });

  it("maps every service to a known family and valid after-service policy", () => {
    const families = new Set(SERVICE_FAMILIES.map((family) => family.code));
    const policies = new Set(["warranty", "quality_claim", "redelivery", "none"]);
    for (const service of SERVICE_CATALOG) {
      expect(families.has(service.family)).toBe(true);
      expect(policies.has(service.afterServicePolicy)).toBe(true);
    }
  });

  it("preserves policy distinctions between repair, cleaning and delivery", () => {
    expect(getServiceDefinition("plumbing")?.afterServicePolicy).toBe("warranty");
    expect(getServiceDefinition("home_cleaning")?.afterServicePolicy).toBe("quality_claim");
    expect(getServiceDefinition("gas_cylinder")?.afterServicePolicy).toBe("redelivery");
    expect(getServicesByFamily("repair").length).toBeGreaterThan(5);
  });
});
