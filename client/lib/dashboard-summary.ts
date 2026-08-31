export interface SalesQuantityItem {
  unit: string;
  quantity: number;
  revenue: number;
}

export function getSalesSummaryTitle(items?: SalesQuantityItem[]) {
  if (!items || items.length === 0) return "Sotuv miqdori";
  if (items.length > 1) return "Sotuvlar birlik bo'yicha";

  const unit = items[0].unit || "birlik";
  if (unit.toLowerCase() === "litr") return "Litrda sotuv";

  return `${unit} bo'yicha sotuv`;
}

export function getSalesRevenueLabel(items?: SalesQuantityItem[]) {
  if (!items || items.length !== 1) return "umumiy daromad";

  return `${items[0].unit} sotuv daromadi`;
}

export function hasLiterSales(items?: SalesQuantityItem[]) {
  return Boolean(items?.some((item) => item.unit.toLowerCase() === "litr" && item.quantity > 0));
}
