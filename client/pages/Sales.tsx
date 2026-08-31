import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/api";
import { DAILY_FILTERS, DailyFilter, buildSaleDefaults, filterEntriesByPeriod } from "@/lib/daily-work";
import { calculateEntryTotal, formatCurrencyPlain, getTodayInputValue } from "@/lib/entry-defaults";
import { cn } from "@/lib/utils";
import { CreateSaleRequest, Customer, Product, Sale } from "@shared/api";
import { format } from "date-fns";
import { CalendarDays, Check, Edit, Loader2, MoreVertical, Package, Plus, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

function summarizeSalesUnits(sales: Sale[]) {
  const grouped = new Map<string, number>();

  for (const sale of sales) {
    const unit = sale.product?.unit || "birlik";
    grouped.set(unit, (grouped.get(unit) || 0) + Number(sale.quantity || 0));
  }

  return Array.from(grouped.entries())
    .map(([unit, quantity]) => `${quantity.toFixed(1)} ${unit}`)
    .join(", ");
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [periodFilter, setPeriodFilter] = useState<DailyFilter>("today");
  const [keepAdding, setKeepAdding] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const canEdit = currentUser && ["ADMIN", "MANAGER"].includes(currentUser.role);
  const [openSaleMenu, setOpenSaleMenu] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateSaleRequest>({
    defaultValues: buildSaleDefaults(),
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getSales();
      setSales(data);
    } catch (err) {
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
    } catch (err) {
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err) {
      setProducts([]);
    }
  };

  const formatInputDate = (value: string) => format(new Date(value), "yyyy-MM-dd");
  const today = getTodayInputValue();

  const periodSales = useMemo(
    () => filterEntriesByPeriod(sales, periodFilter),
    [sales, periodFilter],
  );
  const activePeriodLabel = DAILY_FILTERS.find((filter) => filter.value === periodFilter)?.label || "Bugun";

  const filteredSales = periodSales.filter(
    (sale) =>
      (sale.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.date && formatInputDate(sale.date).includes(searchTerm)),
  );

  const selectedProductId = watch("productId");
  const selectedProduct = products.find((product) => String(product.id) === String(selectedProductId));
  const quantity = watch("quantity");
  const pricePerUnit = watch("pricePerUnit");
  const total = calculateEntryTotal(quantity, pricePerUnit);

  const todaySummary = useMemo(() => {
    const todaySales = sales.filter((sale) => formatInputDate(sale.date) === today);
    const totalRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    return {
      count: todaySales.length,
      totalRevenue,
      quantities: summarizeSalesUnits(todaySales) || "0",
    };
  }, [sales, today]);

  useEffect(() => {
    setValue("total", total);
  }, [setValue, total]);

  const handleNewSale = () => {
    setEditingSale(null);
    setError("");
    reset(buildSaleDefaults());
    setIsSheetOpen(true);
  };

  useEffect(() => {
    const shouldOpenForm =
      Boolean((location.state as { openForm?: boolean } | null)?.openForm) ||
      new URLSearchParams(location.search).get("new") === "1";

    if (!shouldOpenForm || !canEdit || isSheetOpen) return;

    handleNewSale();
    navigate(location.pathname, { replace: true });
  }, [canEdit, isSheetOpen, location.pathname, location.search, location.state, navigate]);

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setError("");
    reset({
      customerId: sale.customerId,
      productId: sale.productId,
      date: sale.date.slice(0, 10),
      quantity: sale.quantity,
      pricePerUnit: sale.pricePerUnit,
      total: sale.total,
    });
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Siz rostdan ham bu sotuvni o'chirmoqchimisiz?")) return;
    try {
      await apiClient.deleteSale(id);
      setSales(sales.filter((sale) => sale.id !== id));
    } catch (err) {
      setError("Sotuvni o'chirishda xatolik yuz berdi");
    }
  };

  const applySelectedProductPrice = (productId = selectedProductId) => {
    const product = products.find((item) => String(item.id) === String(productId));
    if (product) setValue("pricePerUnit", product.pricePerUnit);
  };

  const productRegistration = register("productId", {
    required: "Mahsulot talab etiladi",
    onChange: (event) => applySelectedProductPrice(event.target.value),
  });

  const onSubmit = async (data: CreateSaleRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        quantity: Number(data.quantity),
        pricePerUnit: Number(data.pricePerUnit),
        total,
        customerId: Number(data.customerId),
        productId: Number(data.productId),
      };

      if (editingSale) {
        const updated = await apiClient.updateSale(editingSale.id, payload);
        setSales(sales.map((sale) => (sale.id === editingSale.id ? updated : sale)));
        setIsSheetOpen(false);
        reset(buildSaleDefaults());
        setEditingSale(null);
      } else {
        const created = await apiClient.createSale(payload);
        setSales([created, ...sales]);

        if (keepAdding) {
          reset({
            ...buildSaleDefaults(),
            customerId: Number(data.customerId),
            productId: Number(data.productId),
            pricePerUnit: Number(data.pricePerUnit),
          });
        } else {
          setIsSheetOpen(false);
          reset(buildSaleDefaults());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Kunlik hisob</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sotuvlar</h1>
          </div>

          {canEdit && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={handleNewSale} className="h-11 shrink-0 gap-2 px-4">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Yangi sotuv</span>
                  <span className="sm:hidden">Yozish</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2"
              >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <SheetHeader className="sticky top-0 z-10 border-b bg-background px-5 py-4 text-left">
                    <SheetTitle>{editingSale ? "Sotuvni tahrirlash" : "Yangi sotuv"}</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-5 px-5 py-5">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerId">Mijoz</Label>
                        <select
                          id="customerId"
                          {...register("customerId", { required: "Mijoz talab etiladi" })}
                          className="h-12 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Mijozni tanlang</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                        {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="productId">Mahsulot</Label>
                        <select
                          id="productId"
                          {...productRegistration}
                          className="h-12 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Mahsulotni tanlang</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.unit}
                            </option>
                          ))}
                        </select>
                        {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="date">Sana</Label>
                          <Input id="date" type="date" className="h-12 text-base" {...register("date", { required: "Sana talab etiladi" })} />
                          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Miqdor{selectedProduct?.unit ? `, ${selectedProduct.unit}` : ""}</Label>
                          <Input
                            id="quantity"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            className="h-12 text-base"
                            {...register("quantity", { required: "Miqdor talab etiladi", min: 0 })}
                          />
                          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="pricePerUnit">Birlik narxi</Label>
                          {selectedProduct && (
                            <Badge variant="secondary" className="rounded-md">
                              Katalog: {formatCurrencyPlain(selectedProduct.pricePerUnit)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="pricePerUnit"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            className="h-12 text-base"
                            {...register("pricePerUnit", { required: "Birlik narxi talab etiladi", min: 0 })}
                          />
                          <Button type="button" variant="outline" className="h-12 shrink-0 px-3" onClick={() => applySelectedProductPrice()}>
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Katalog narxini qo'yish</span>
                          </Button>
                        </div>
                        {errors.pricePerUnit && <p className="text-sm text-destructive">{errors.pricePerUnit.message}</p>}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Jami tushum</span>
                        <strong className="text-xl tabular-nums text-foreground">{formatCurrencyPlain(total)}</strong>
                      </div>
                    </div>

                    {!editingSale && (
                      <label className="flex min-h-14 items-center justify-between gap-4 rounded-xl border bg-background p-4">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">Yana sotuv qo'shish</span>
                        </span>
                        <Switch checked={keepAdding} onCheckedChange={setKeepAdding} />
                      </label>
                    )}
                  </div>

                  <SheetFooter className="sticky bottom-0 gap-2 border-t bg-background px-5 py-4 sm:flex-row">
                    <SheetClose asChild>
                      <Button type="button" variant="outline" className="h-12 w-full sm:w-auto">
                        Bekor qilish
                      </Button>
                    </SheetClose>
                    <Button type="submit" disabled={isSubmitting} className="h-12 w-full sm:w-auto">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {editingSale ? "Yangilash" : "Saqlash"}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Bugungi sotuv</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{todaySummary.quantities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Bugungi tushum</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrencyPlain(todaySummary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Yozuvlar</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{todaySummary.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Mahsulotlar</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{products.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {DAILY_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant="ghost"
              onClick={() => setPeriodFilter(filter.value)}
              className={cn(
                "h-10 min-w-fit flex-1 rounded-lg px-3 text-sm",
                periodFilter === filter.value
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mijoz, mahsulot yoki sana bo'yicha qidirish"
            className="h-12 pl-10 text-base"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">{searchTerm ? "Qidiruv bo'yicha sotuv topilmadi." : `${activePeriodLabel} uchun sotuv yo'q.`}</p>
              {!searchTerm && canEdit && (
                <Button variant="outline" onClick={handleNewSale} className="mt-4 h-11 gap-2">
                  <Plus className="h-4 w-4" />
                  Sotuv yozish
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">
                          {sale.customer?.name || `Mijoz #${sale.customerId}`}
                        </h2>
                        {formatInputDate(sale.date) === today && <Badge className="rounded-md">Bugun</Badge>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        {sale.product?.name || `Mahsulot #${sale.productId}`}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {formatInputDate(sale.date)}
                      </div>
                    </div>

                    {canEdit && (
                      <DropdownMenu
                        open={openSaleMenu === sale.id}
                        onOpenChange={(open) => setOpenSaleMenu(open ? sale.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Sotuv amallari</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleEdit(sale); setOpenSaleMenu(null); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { handleDelete(sale.id); setOpenSaleMenu(null); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Miqdor</p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {Number(sale.quantity).toFixed(1)} {sale.product?.unit || ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Narx</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatCurrencyPlain(sale.pricePerUnit)}</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-xs text-muted-foreground">Jami</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatCurrencyPlain(sale.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
