import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/api";
import { Customer } from "@shared/api";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Predefined customer types
const CUSTOMER_TYPES = [
  { value: "Chakana", label: "Chakana" },
  { value: "Ulgurji", label: "Ulgurji" },
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser } = useUser();
  const canEdit = currentUser && ["ADMIN", "MANAGER"].includes(currentUser.role);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      type: "",
      phone: "",
      notes: "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
    } catch (err) {
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
  );

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setValue("name", customer.name);
    setValue("type", customer.type);
    setValue("phone", customer.phone || "");
    setValue("notes", customer.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Mijozni o'chirmoqchimisiz?")) return;
    try {
      await apiClient.deleteCustomer(id);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err) {
      setError("Mijozni o'chirishda xatolik yuz berdi.");
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError("");
    try {
      if (editingCustomer) {
        const updated = await apiClient.updateCustomer(editingCustomer.id, data);
        // Handle both direct Customer object and wrapped response
        const updatedCustomer = (updated as any).customer || updated;
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? updatedCustomer : c)));
      } else {
        const created = await apiClient.createCustomer(data);
        // Handle both direct Customer object and wrapped response
        const createdCustomer = (created as any).customer || created;
        setCustomers([...customers, createdCustomer]);
      }
      setIsDialogOpen(false);
      reset();
      setEditingCustomer(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
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
            <h1 className="text-3xl font-bold text-foreground">Mijozlar</h1>
            <p className="text-muted-foreground">
              Mijozlar ro'yxatini boshqaring.
            </p>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewCustomer} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Mijoz qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Mijozni tahrirlash" : "Yangi mijoz qo'shish"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCustomer
                      ? "Quyidagi mijoz ma'lumotlarini yangilang."
                      : "Yangi mijoz uchun ma'lumotlarni kiriting."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Mijoz ismi</Label>
                    <Input
                      id="name"
                      placeholder="Mijoz ismini kiriting"
                      {...register("name", { required: "Mijoz ismi majburiy" })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Turi</Label>
                    <Select value={selectedType} onValueChange={(value) => setValue("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mijoz turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqami</Label>
                    <Input
                      id="phone"
                      placeholder="Telefon raqamini kiriting"
                      {...register("phone", { required: "Telefon raqami majburiy" })}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Mijoz haqida qo'shimcha izoh"
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
                          {editingCustomer ? "Yangilanmoqda..." : "Yaratilmoqda..."}
                        </>
                      ) : editingCustomer ? (
                        "Mijozni yangilash"
                      ) : (
                        "Mijozni yaratish"
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
            placeholder="Mijozlarni qidiring..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Customers List */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-destructive">{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Qidiruv bo'yicha mijoz topilmadi."
                  : "Hali mijozlar qo'shilmagan."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-4 pb-4 flex flex-col gap-2">
                  <div className="font-semibold text-lg">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.phone || "Noma'lum"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Turi: {customer.type}
                  </div>
                  {customer.notes && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {customer.notes}
                    </div>
                  )}
                  {canEdit && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
                        <Edit className="h-4 w-4 mr-1" /> Tahrirlash
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> O'chirish
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
