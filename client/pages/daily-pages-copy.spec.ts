import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pages = ["MilkPurchases.tsx", "Sales.tsx"].map((page) => ({
  page,
  source: readFileSync(join(process.cwd(), "client/pages", page), "utf8"),
}));

const helperCopy = [
  "Sut kirimini tez yozing",
  "Mahsulot chiqimini tez yozing",
  "Sana bugungi kun bilan",
  "narx esa saqlangan standart qiymat",
  "Mahsulot tanlansa",
  "Narxni o'zgartirish mumkin",
  "Narx avtomatik to'ladi",
  "Saqlagandan keyin forma ochiq qoladi",
];

describe("daily page copy", () => {
  it("keeps purchase and sale screens free from helper paragraphs", () => {
    for (const { page, source } of pages) {
      for (const copy of helperCopy) {
        expect(source, `${page} should not include "${copy}"`).not.toContain(copy);
      }
    }
  });
});
