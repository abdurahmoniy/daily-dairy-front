import { getTodayInputValue } from "./entry-defaults";

export type DailyFilter = "today" | "yesterday" | "month" | "all";

export const DAILY_FILTERS: Array<{ value: DailyFilter; label: string }> = [
  { value: "today", label: "Bugun" },
  { value: "yesterday", label: "Kecha" },
  { value: "month", label: "Bu oy" },
  { value: "all", label: "Barchasi" },
];

export function getDailyWorkMobileNavigation() {
  return [
    { name: "Boshqaruv", href: "/dashboard" },
    { name: "Xarid", href: "/milk-purchases" },
    { name: "Sotuv", href: "/sales" },
    { name: "Mijozlar", href: "/customers" },
    { name: "Ko'proq", href: null },
  ];
}

export function filterEntriesByPeriod<T extends { date?: string }>(
  entries: T[],
  filter: DailyFilter,
  now = new Date(),
) {
  if (filter === "all") return entries;

  const today = getTodayInputValue(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getTodayInputValue(yesterdayDate);
  const currentMonth = today.slice(0, 7);

  return entries.filter((entry) => {
    if (!entry.date) return false;
    const entryDate = getTodayInputValue(new Date(entry.date));

    if (filter === "today") return entryDate === today;
    if (filter === "yesterday") return entryDate === yesterday;
    return entryDate.startsWith(currentMonth);
  });
}

export function buildPurchaseDefaults(defaultMilkPrice: number, date = new Date()) {
  return {
    supplierId: undefined,
    date: getTodayInputValue(date),
    quantityLiters: 0,
    pricePerLiter: defaultMilkPrice,
    total: 0,
  };
}

export function buildSaleDefaults(date = new Date()) {
  return {
    customerId: undefined,
    productId: undefined,
    date: getTodayInputValue(date),
    quantity: 0,
    pricePerUnit: 0,
    total: 0,
  };
}
