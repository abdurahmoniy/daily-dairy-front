import { describe, expect, it } from "vitest";
import { attachSupplierToPurchase } from "./purchase-supplier";
import { MilkPurchase, Supplier } from "@shared/api";

const suppliers: Supplier[] = [
  { id: 1, name: "Ali Sut", phone: "111" },
  { id: 2, name: "Vali Dairy", phone: "222" },
];

const purchase: MilkPurchase = {
  id: 10,
  supplierId: 2,
  date: "2026-09-01T00:00:00.000Z",
  quantityLiters: 12,
  pricePerLiter: 8000,
  total: 96000,
};

describe("attachSupplierToPurchase", () => {
  it("hydrates the supplier from the local supplier list", () => {
    expect(attachSupplierToPurchase(purchase, suppliers).supplier).toEqual(suppliers[1]);
  });

  it("keeps an existing supplier from the API response", () => {
    const existingSupplier = { id: 2, name: "API Supplier", phone: "333" };

    expect(attachSupplierToPurchase({ ...purchase, supplier: existingSupplier }, suppliers).supplier).toEqual(
      existingSupplier,
    );
  });
});
