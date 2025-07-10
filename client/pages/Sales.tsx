import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/api";
import { CreateSaleRequest, Customer, Product, Sale } from "@shared/api";
import { format } from "date-fns";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
    defaultValues: {
      customerId: undefined,
      productId: undefined,
      date: "",
      quantity: 0,
      pricePerUnit: 0,
      total: 0,
    },
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

  const filteredSales = sales.filter(
    (sale) =>
      (sale.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.date && format(new Date(sale.date), "yyyy-MM-dd").includes(searchTerm))
  );

  const handleNewSale = () => {
    setEditingSale(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setValue("customerId", sale.customerId);
    setValue("productId", sale.productId);
    setValue("date", sale.date.slice(0, 10));
    setValue("quantity", sale.quantity);
    setValue("pricePerUnit", sale.pricePerUnit);
    setValue("total", sale.total);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Siz rostdan ham bu sotuvni o'chirmoqchimisiz?")) return;
    try {
      await apiClient.deleteSale(id);
      setSales(sales.filter((s) => s.id !== id));
    } catch (err) {
      setError("Sotuvni o'chirishda xatolik yuz berdi");
    }
  };

  // Auto-calculate total
  const quantity = watch("quantity");
  const pricePerUnit = watch("pricePerUnit");
  useEffect(() => {
    setValue("total", Number(quantity) * Number(pricePerUnit));
  }, [quantity, pricePerUnit, setValue]);

  const onSubmit = async (data: CreateSaleRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        quantity: Number(data.quantity),
        pricePerUnit: Number(data.pricePerUnit),
        total: Number(data.total),
        customerId: Number(data.customerId),
        productId: Number(data.productId),
      };

      if (editingSale) {
        const updated = await apiClient.updateSale(editingSale.id, payload);
        setSales(sales.map((s) => (s.id === editingSale.id ? updated : s)));
      } else {
        const created = await apiClient.createSale(payload);
        setSales([...sales, created]);
      }
      setIsDialogOpen(false);
      reset();
      setEditingSale(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sotuvlar</h1>
            <p className="text-muted-foreground">
              Sotuvlar va mijoz xaridlarini kuzatib boring.
            </p>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewSale} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yangi sotuv
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSale ? "Sotuvni tahrirlash" : "Yangi sotuvni yozib qo'shish"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSale
                      ? "Quyidagi sotuv ma'lumotlarini yangilang."
                      : "Yangi sotuv uchun ma'lumotlarni kiriting."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Mijoz</Label>
                    <select
                      id="customerId"
                      {...register("customerId", { required: "Mijoz talab etiladi" })}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Mijozni tanlang</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.customerId && (
                      <p className="text-sm text-destructive">{errors.customerId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productId">Mahsulot</Label>
                    <select
                      id="productId"
                      {...register("productId", { required: "Mahsulot talab etiladi" })}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Mahsulotni tanlang</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.productId && (
                      <p className="text-sm text-destructive">{errors.productId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Sana</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register("date", { required: "Sana talab etiladi" })}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Miqdor</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      {...register("quantity", { required: "Miqdor talab etiladi", min: 0 })}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Narxi birligi</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      {...register("pricePerUnit", { required: "Narxi birligi talab etiladi", min: 0 })}
                    />
                    {errors.pricePerUnit && (
                      <p className="text-sm text-destructive">{errors.pricePerUnit.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Jami</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      {...register("total", { required: "Jami talab etiladi", min: 0 })}
                      readOnly
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          {editingSale ? "Yangilanmoqda..." : "Yaratilmoqda..."}
                        </>
                      ) : editingSale ? (
                        "Sotuvni yangilash"
                      ) : (
                        "Sotuvni yaratish"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Sotuvlarni qidiring..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Sales List */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Qidiruv bo'yicha sotuv topilmadi."
                  : "Hali sotuvlar yozilmagan."}
              </p>
              {!searchTerm && canEdit && (
                <Button
                  variant="outline"
                  onClick={handleNewSale}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Birinchi sotuvingizni yozib qo'shing
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {sale.customer?.name || `Mijoz #${sale.customerId}`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Mahsulot: {sale.product?.name || `Mahsulot #${sale.productId}`}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Sana: {format(new Date(sale.date), "yyyy-MM-dd")}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Miqdor: {sale.quantity}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Narxi: {sale.pricePerUnit} so'm
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Jami: {sale.total} so'm
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <DropdownMenu
                        open={openSaleMenu === sale.id}
                        onOpenChange={(open) => setOpenSaleMenu(open ? sale.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
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
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
