import { MilkPurchase, Supplier } from "@shared/api";

export function attachSupplierToPurchase<T extends MilkPurchase>(purchase: T, suppliers: Supplier[]): T {
  if (purchase.supplier) return purchase;

  const supplier = suppliers.find((item) => item.id === purchase.supplierId);
  if (!supplier) return purchase;

  return { ...purchase, supplier };
}
