import { describe, expect, it } from "vitest";
import { formatDailyProductSales, getControlPanelActions } from "./control-panel";

describe("control panel helpers", () => {
  it("keeps the daily control panel focused on three actions", () => {
    expect(getControlPanelActions()).toEqual([
      { label: "Sut xaridi yozish", href: "/milk-purchases", openForm: true },
      { label: "Sotuv yozish", href: "/sales", openForm: true },
      { label: "Dashboard", href: "/analytics-dashboard", openForm: false },
    ]);
  });

  it("formats today's sales by product for the minimal KPI card", () => {
    expect(
      formatDailyProductSales([
        { productName: "Qatiq", productUnit: "Litr", unitsSold: 20, totalRevenue: 140000 },
        { productName: "Suzma", productUnit: "Kg", unitsSold: 10, totalRevenue: 210000 },
      ]),
    ).toEqual([
      { label: "Qatiq", value: "20.0 Litr", revenue: 140000 },
      { label: "Suzma", value: "10.0 Kg", revenue: 210000 },
    ]);
  });

  it("returns an empty list when there are no product sales today", () => {
    expect(formatDailyProductSales([])).toEqual([]);
  });
});
