import { describe, expect, it } from "vitest";
import {
  calculateEntryTotal,
  formatCurrencyPlain,
  getDefaultMilkPrice,
  getTodayInputValue,
  saveDefaultMilkPrice,
} from "./entry-defaults";

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  length = 0;

  clear(): void {
    this.items.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
    this.length = this.items.size;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
    this.length = this.items.size;
  }
}

describe("entry defaults", () => {
  it("formats a local date for date inputs", () => {
    expect(getTodayInputValue(new Date(2026, 8, 1))).toBe("2026-09-01");
  });

  it("calculates totals with two decimal precision", () => {
    expect(calculateEntryTotal(12.345, 4567.891)).toBe(56390.61);
  });

  it("calculates totals when quantity is entered with a comma decimal", () => {
    expect(calculateEntryTotal("1,5", 7000)).toBe(10500);
  });

  it("stores and reads the editable default milk price", () => {
    const storage = new MemoryStorage();
    saveDefaultMilkPrice(storage, 4200);

    expect(getDefaultMilkPrice(storage)).toBe(4200);
  });

  it("ignores invalid default milk prices", () => {
    const storage = new MemoryStorage();
    storage.setItem("daily_dairy_default_milk_price", "-100");

    expect(getDefaultMilkPrice(storage)).toBe(0);
  });

  it("formats plain Uzbek currency values without decimals", () => {
    expect(formatCurrencyPlain(504000)).toBe("504 000 so'm");
  });
});
