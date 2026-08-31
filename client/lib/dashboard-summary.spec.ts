import { describe, expect, it } from "vitest";
import { getSalesRevenueLabel, getSalesSummaryTitle } from "./dashboard-summary";

describe("dashboard summary labels", () => {
  it("uses a specific title when all sales are in liters", () => {
    expect(getSalesSummaryTitle([{ unit: "Litr", quantity: 20, revenue: 140000 }])).toBe("Litrda sotuv");
  });

  it("uses a unit-specific title for one non-liter unit", () => {
    expect(getSalesSummaryTitle([{ unit: "Kg", quantity: 8, revenue: 256000 }])).toBe("Kg bo'yicha sotuv");
  });

  it("uses a grouped title when sales contain mixed units", () => {
    expect(
      getSalesSummaryTitle([
        { unit: "Litr", quantity: 20, revenue: 140000 },
        { unit: "Kg", quantity: 8, revenue: 256000 },
      ]),
    ).toBe("Sotuvlar birlik bo'yicha");
  });

  it("uses a specific revenue label for one sales unit", () => {
    expect(getSalesRevenueLabel([{ unit: "Litr", quantity: 20, revenue: 140000 }])).toBe("Litr sotuv daromadi");
  });

  it("uses a general revenue label for mixed sales units", () => {
    expect(
      getSalesRevenueLabel([
        { unit: "Litr", quantity: 20, revenue: 140000 },
        { unit: "Kg", quantity: 8, revenue: 256000 },
      ]),
    ).toBe("umumiy daromad");
  });
});
