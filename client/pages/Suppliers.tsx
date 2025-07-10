import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/api";
import {
  CreateSupplierRequest,
  Supplier
} from "@shared/api";
import { format } from "date-fns";
import {
  Calendar,
  Edit,
  Loader2,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const canEdit = currentUser && ["ADMIN", "MANAGER"].includes(currentUser.role);
  const [openSupplierMenu, setOpenSupplierMenu] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateSupplierRequest>();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.getSuppliers();
      console.log('suppliers_data', data)
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateSupplierRequest) => {
    setIsSubmitting(true);
    setError("");

    try {
      if (editingSupplier) {
        const updated = await apiClient.updateSupplier(
          editingSupplier.id,
          data,
        );
        setSuppliers(
          suppliers.map((s) => (s.id === editingSupplier.id ? updated : s)),
        );
      } else {
        const created = await apiClient.createSupplier(data);
        setSuppliers([...suppliers, created]);
      }
      setIsDialogOpen(false);
      reset();
      setEditingSupplier(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setValue("name", supplier.name);
    setValue("phone", supplier.phone);
    setValue("notes", supplier.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await apiClient.deleteSupplier(id);
      setSuppliers(suppliers.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    reset();
    setIsDialogOpen(true);
  };

  console.log('suppliers_data', suppliers)

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm),
  );

  // if (isLoading) {
  //   return (
  //     <DashboardLayout>
  //       <div className="p-6 flex items-center justify-center">
  //         <div className="text-center">
  //           <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
  //           <p className="text-muted-foreground">Loading suppliers...</p>
  //         </div>
  //       </div>
  //     </DashboardLayout>
  //   );
  // }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Yetkazib beruvchilar</h1>
            <p className="text-muted-foreground">
              Sut yetkazib beruvchilar va ularning ma'lumotlarini boshqaring.
            </p>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewSupplier} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yetkazib beruvchi qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? "Yetkazib beruvchini tahrirlash" : "Yangi yetkazib beruvchi qo'shish"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSupplier
                      ? "Quyidagi yetkazib beruvchi ma'lumotlarini yangilang."
                      : "Yangi yetkazib beruvchi uchun ma'lumotlarni kiriting."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Yetkazib beruvchi ismi</Label>
                    <Input
                      id="name"
                      placeholder="Yetkazib beruvchi ismini kiriting"
                      {...register("name", {
                        required: "Yetkazib beruvchi ismi majburiy",
                      })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqami</Label>
                    <Input
                      id="phone"
                      placeholder="Telefon raqamini kiriting"
                      {...register("phone", {
                        required: "Telefon raqami majburiy",
                      })}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Yetkazib beruvchi haqida qo'shimcha izoh"
                      rows={3}
                      {...register("notes")}
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingSupplier ? "Yangilanmoqda..." : "Yaratilmoqda..."}
                        </>
                      ) : editingSupplier ? (
                        "Yetkazib beruvchini yangilash"
                      ) : (
                        "Yetkazib beruvchini yaratish"
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
            placeholder="Yetkazib beruvchilarni qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-destructive">{error}</div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Qidiruv bo'yicha yetkazib beruvchi topilmadi."
                  : "Hali yetkazib beruvchilar qo'shilmagan."}
              </p>
              {!searchTerm && (
                canEdit && (
                  <Button
                    variant="outline"
                    onClick={handleNewSupplier}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Birinchi yetkazib beruvchini qo'shish
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {supplier.phone || "Noma'lum"}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <DropdownMenu
                        open={openSupplierMenu === supplier.id}
                        onOpenChange={(open) => setOpenSupplierMenu(open ? supplier.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleEdit(supplier); setOpenSupplierMenu(null); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { handleDelete(supplier.id); setOpenSupplierMenu(null); }}
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
                <CardContent className="pt-0">
                  {supplier.notes && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {supplier.notes}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Qo'shildi {supplier.createdAt
                        ? format(new Date(supplier.createdAt), "yyyy-MM-dd")
                        : "Noma'lum"}
                    </span>
                    <Badge>
                      ID: {supplier.id}
                    </Badge>
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
