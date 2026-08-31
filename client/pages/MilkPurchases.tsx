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
import { DAILY_FILTERS, DailyFilter, buildPurchaseDefaults, filterEntriesByPeriod } from "@/lib/daily-work";
import { calculateEntryTotal, formatCurrencyPlain, getDefaultMilkPrice, getTodayInputValue, saveDefaultMilkPrice } from "@/lib/entry-defaults";
import { cn } from "@/lib/utils";
import { CreateMilkPurchaseRequest, MilkPurchase, Supplier } from "@shared/api";
import { format } from "date-fns";
import { CalendarDays, Check, Edit, Loader2, MoreVertical, Plus, Save, Search, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

export default function MilkPurchases() {
  const [purchases, setPurchases] = useState<MilkPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MilkPurchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [defaultMilkPrice, setDefaultMilkPrice] = useState(() => getDefaultMilkPrice());
  const [periodFilter, setPeriodFilter] = useState<DailyFilter>("today");
  const [keepAdding, setKeepAdding] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const canEdit = currentUser && ["ADMIN", "MANAGER"].includes(currentUser.role);
  const [openPurchaseMenu, setOpenPurchaseMenu] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateMilkPurchaseRequest>({
    defaultValues: buildPurchaseDefaults(defaultMilkPrice),
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, []);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getMilkPurchases();
      setPurchases(data);
    } catch (err) {
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setSuppliers([]);
    }
  };

  const formatInputDate = (value: string) => format(new Date(value), "yyyy-MM-dd");
  const today = getTodayInputValue();

  const periodPurchases = useMemo(
    () => filterEntriesByPeriod(purchases, periodFilter),
    [purchases, periodFilter],
  );
  const activePeriodLabel = DAILY_FILTERS.find((filter) => filter.value === periodFilter)?.label || "Bugun";

  const filteredPurchases = periodPurchases.filter(
    (purchase) =>
      (purchase.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.date && formatInputDate(purchase.date).includes(searchTerm)),
  );

  const todaySummary = useMemo(() => {
    const todayPurchases = purchases.filter((purchase) => formatInputDate(purchase.date) === today);
    const totalLiters = todayPurchases.reduce((sum, purchase) => sum + Number(purchase.quantityLiters || 0), 0);
    const totalCost = todayPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);

    return {
      count: todayPurchases.length,
      totalLiters,
      totalCost,
    };
  }, [purchases, today]);

  const handleNewPurchase = () => {
    setEditingPurchase(null);
    setError("");
    reset(buildPurchaseDefaults(defaultMilkPrice));
    setIsSheetOpen(true);
  };

  useEffect(() => {
    const shouldOpenForm =
      Boolean((location.state as { openForm?: boolean } | null)?.openForm) ||
      new URLSearchParams(location.search).get("new") === "1";

    if (!shouldOpenForm || !canEdit || isSheetOpen) return;

    handleNewPurchase();
    navigate(location.pathname, { replace: true });
  }, [canEdit, isSheetOpen, location.pathname, location.search, location.state, navigate]);

  const handleEdit = (purchase: MilkPurchase) => {
    setEditingPurchase(purchase);
    setError("");
    reset({
      supplierId: purchase.supplierId,
      date: purchase.date.slice(0, 10),
      quantityLiters: purchase.quantityLiters,
      pricePerLiter: purchase.pricePerLiter,
      total: purchase.total,
    });
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Xaridni o'chirishni xohlaysizmi?")) return;
    try {
      await apiClient.deleteMilkPurchase(id);
      setPurchases(purchases.filter((purchase) => purchase.id !== id));
    } catch (err) {
      setError("Xaridni o'chirishda muammo yuz berdi");
    }
  };

  const quantityLiters = watch("quantityLiters");
  const pricePerLiter = watch("pricePerLiter");
  const total = calculateEntryTotal(quantityLiters, pricePerLiter);

  useEffect(() => {
    setValue("total", total);
  }, [setValue, total]);

  const handleSaveDefaultPrice = () => {
    const price = Number(pricePerLiter);
    saveDefaultMilkPrice(window.localStorage, price);
    setDefaultMilkPrice(price > 0 ? price : 0);
  };

  const onSubmit = async (data: CreateMilkPurchaseRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        quantityLiters: Number(data.quantityLiters),
        pricePerLiter: Number(data.pricePerLiter),
        total,
        supplierId: Number(data.supplierId),
      };

      if (editingPurchase) {
        const updated = await apiClient.updateMilkPurchase(editingPurchase.id, payload);
        setPurchases(purchases.map((purchase) => (purchase.id === editingPurchase.id ? updated : purchase)));
        setIsSheetOpen(false);
        reset(buildPurchaseDefaults(defaultMilkPrice));
        setEditingPurchase(null);
      } else {
        const created = await apiClient.createMilkPurchase(payload);
        setPurchases([created, ...purchases]);

        if (keepAdding) {
          reset({
            ...buildPurchaseDefaults(Number(data.pricePerLiter)),
            supplierId: Number(data.supplierId),
          });
        } else {
          setIsSheetOpen(false);
          reset(buildPurchaseDefaults(defaultMilkPrice));
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sut xaridlari</h1>
          </div>

          {canEdit && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={handleNewPurchase} className="h-11 shrink-0 gap-2 px-4">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Xarid yozish</span>
                  <span className="sm:hidden">Yozish</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2"
              >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <SheetHeader className="sticky top-0 z-10 border-b bg-background px-5 py-4 text-left">
                    <SheetTitle>{editingPurchase ? "Xaridni tahrirlash" : "Yangi sut xaridi"}</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-5 px-5 py-5">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplierId">Yetkazib beruvchi</Label>
                        <select
                          id="supplierId"
                          {...register("supplierId", { required: "Yetkazib beruvchi majburiy" })}
                          className="h-12 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Yetkazib beruvchini tanlang</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                        {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="date">Sana</Label>
                          <Input id="date" type="date" className="h-12 text-base" {...register("date", { required: "Sana majburiy" })} />
                          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantityLiters">Miqdor, litr</Label>
                          <Input
                            id="quantityLiters"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            className="h-12 text-base"
                            {...register("quantityLiters", { required: "Miqdor majburiy", min: 0 })}
                          />
                          {errors.quantityLiters && <p className="text-sm text-destructive">{errors.quantityLiters.message}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="pricePerLiter">1 litr narxi</Label>
                          {defaultMilkPrice > 0 && (
                            <Badge variant="secondary" className="rounded-md">
                              Standart: {formatCurrencyPlain(defaultMilkPrice)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="pricePerLiter"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            className="h-12 text-base"
                            {...register("pricePerLiter", { required: "1 litr narxi majburiy", min: 0 })}
                          />
                          <Button type="button" variant="outline" className="h-12 shrink-0 px-3" onClick={handleSaveDefaultPrice}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Standart narx sifatida saqlash</span>
                          </Button>
                        </div>
                        {errors.pricePerLiter && <p className="text-sm text-destructive">{errors.pricePerLiter.message}</p>}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Jami summa</span>
                        <strong className="text-xl tabular-nums text-foreground">{formatCurrencyPlain(total)}</strong>
                      </div>
                    </div>

                    {!editingPurchase && (
                      <label className="flex min-h-14 items-center justify-between gap-4 rounded-xl border bg-background p-4">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">Yana xarid qo'shish</span>
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
                      {editingPurchase ? "Yangilash" : "Saqlash"}
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
              <p className="text-xs text-muted-foreground">Bugun olindi</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{todaySummary.totalLiters.toFixed(1)} L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Bugungi xarajat</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrencyPlain(todaySummary.totalCost)}</p>
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
              <p className="text-xs text-muted-foreground">Standart narx</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{defaultMilkPrice ? formatCurrencyPlain(defaultMilkPrice) : "Belgilanmagan"}</p>
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
            placeholder="Yetkazuvchi yoki sana bo'yicha qidirish"
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
        ) : filteredPurchases.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">{searchTerm ? "Qidiruv bo'yicha xarid topilmadi." : `${activePeriodLabel} uchun xarid yo'q.`}</p>
              {!searchTerm && canEdit && (
                <Button variant="outline" onClick={handleNewPurchase} className="mt-4 h-11 gap-2">
                  <Plus className="h-4 w-4" />
                  Xarid yozish
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">
                          {purchase.supplier?.name || `Yetkazib beruvchi #${purchase.supplierId}`}
                        </h2>
                        {formatInputDate(purchase.date) === today && <Badge className="rounded-md">Bugun</Badge>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {formatInputDate(purchase.date)}
                      </div>
                    </div>

                    {canEdit && (
                      <DropdownMenu
                        open={openPurchaseMenu === purchase.id}
                        onOpenChange={(open) => setOpenPurchaseMenu(open ? purchase.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Xarid amallari</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleEdit(purchase); setOpenPurchaseMenu(null); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { handleDelete(purchase.id); setOpenPurchaseMenu(null); }}
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
                    <div className={cn("rounded-lg bg-muted/60 p-3")}>
                      <p className="text-xs text-muted-foreground">Miqdor</p>
                      <p className="mt-1 font-semibold tabular-nums">{Number(purchase.quantityLiters).toFixed(1)} L</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Narx</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatCurrencyPlain(purchase.pricePerLiter)}</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-xs text-muted-foreground">Jami</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatCurrencyPlain(purchase.total)}</p>
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
