export interface DailyProductSale {
  productName: string;
  productUnit?: string;
  unitsSold: number;
  totalRevenue: number;
}

export function getControlPanelActions() {
  return [
    { label: "Sut xaridi yozish", href: "/milk-purchases", openForm: true },
    { label: "Sotuv yozish", href: "/sales", openForm: true },
    { label: "Dashboard", href: "/analytics-dashboard", openForm: false },
  ];
}

export function formatDailyProductSales(items: DailyProductSale[]) {
  return items.map((item) => ({
    label: item.productName,
    value: `${Number(item.unitsSold || 0).toFixed(1)} ${item.productUnit || "birlik"}`,
    revenue: Number(item.totalRevenue || 0),
  }));
}
