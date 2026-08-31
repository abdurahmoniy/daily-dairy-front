import { describe, expect, it } from "vitest";
import {
  DAILY_FILTERS,
  buildPurchaseDefaults,
  buildSaleDefaults,
  filterEntriesByPeriod,
  getDailyWorkMobileNavigation,
} from "./daily-work";

describe("daily work helpers", () => {
  it("keeps daily work pages in the primary mobile navigation", () => {
    expect(getDailyWorkMobileNavigation().map((item) => item.name)).toEqual([
      "Boshqaruv",
      "Xarid",
      "Sotuv",
      "Mijozlar",
      "Ko'proq",
    ]);
  });

  it("defaults list filtering to today's entries", () => {
    const entries = [
      { id: 1, date: "2026-09-01T05:00:00.000Z" },
      { id: 2, date: "2026-08-31T05:00:00.000Z" },
    ];

    expect(filterEntriesByPeriod(entries, "today", new Date(2026, 8, 1))).toEqual([
      { id: 1, date: "2026-09-01T05:00:00.000Z" },
    ]);
  });

  it("supports all period filter choices used by daily pages", () => {
    expect(DAILY_FILTERS.map((filter) => filter.value)).toEqual(["today", "yesterday", "month", "all"]);
  });

  it("builds purchase defaults for adding another purchase quickly", () => {
    expect(buildPurchaseDefaults(4200, new Date(2026, 8, 1))).toEqual({
      supplierId: undefined,
      date: "2026-09-01",
      quantityLiters: 0,
      pricePerLiter: 4200,
      total: 0,
    });
  });

  it("builds sale defaults for quick repeat entry", () => {
    expect(buildSaleDefaults(new Date(2026, 8, 1))).toEqual({
      customerId: undefined,
      productId: undefined,
      date: "2026-09-01",
      quantity: 0,
      pricePerUnit: 0,
      total: 0,
    });
  });
});
