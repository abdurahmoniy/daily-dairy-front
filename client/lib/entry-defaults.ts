export const DEFAULT_MILK_PRICE_KEY = "daily_dairy_default_milk_price";

export function getTodayInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDecimalInput(value: number | string) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function calculateEntryTotal(quantity: number | string, price: number | string) {
  const total = parseDecimalInput(quantity) * parseDecimalInput(price);
  return Math.round(total * 100) / 100;
}

export function getDefaultMilkPrice(storage: Pick<Storage, "getItem"> = window.localStorage) {
  const value = Number(storage.getItem(DEFAULT_MILK_PRICE_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function saveDefaultMilkPrice(
  storage: Pick<Storage, "setItem" | "removeItem"> = window.localStorage,
  price: number | string,
) {
  const value = Number(price);
  if (Number.isFinite(value) && value > 0) {
    storage.setItem(DEFAULT_MILK_PRICE_KEY, String(value));
    return;
  }

  storage.removeItem(DEFAULT_MILK_PRICE_KEY);
}

export function formatCurrencyPlain(amount: number | string) {
  const value = Number(amount || 0);
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted.replace(/[,\u00a0]/g, " ")} so'm`;
}
