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
import { CreateMilkPurchaseRequest, MilkPurchase, Supplier } from "@shared/api";
import { format } from "date-fns";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function MilkPurchases() {
  const [purchases, setPurchases] = useState<MilkPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MilkPurchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
    defaultValues: {
      supplierId: undefined,
      date: "",
      quantityLiters: 0,
      pricePerLiter: 0,
      total: 0,
    },
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

  const filteredPurchases = purchases.filter(
    (purchase) =>
      (purchase.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      || (purchase.date && format(new Date(purchase.date), "yyyy-MM-dd").includes(searchTerm))
  );

  const handleNewPurchase = () => {
    setEditingPurchase(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (purchase: MilkPurchase) => {
    setEditingPurchase(purchase);
    setValue("supplierId", purchase.supplierId);
    setValue("date", purchase.date.slice(0, 10));
    setValue("quantityLiters", purchase.quantityLiters);
    setValue("pricePerLiter", purchase.pricePerLiter);
    setValue("total", purchase.total);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await apiClient.deleteMilkPurchase(id);
      setPurchases(purchases.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete purchase");
    }
  };

  // Auto-calculate total
  const quantityLiters = watch("quantityLiters");
  const pricePerLiter = watch("pricePerLiter");
  useEffect(() => {
    setValue("total", Number(quantityLiters) * Number(pricePerLiter));
  }, [quantityLiters, pricePerLiter, setValue]);

  const onSubmit = async (data: CreateMilkPurchaseRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      if (editingPurchase) {
        const updated = await apiClient.updateMilkPurchase(editingPurchase.id, data);
        setPurchases(purchases.map((p) => (p.id === editingPurchase.id ? updated : p)));
      } else {
        const created = await apiClient.createMilkPurchase(data);
        setPurchases([...purchases, created]);
      }
      setIsDialogOpen(false);
      reset();
      setEditingPurchase(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
            <h1 className="text-3xl font-bold text-foreground">
              Milk Purchases
            </h1>
            <p className="text-muted-foreground">
              Record and track milk procurement from suppliers.
            </p>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewPurchase} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Record Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPurchase ? "Edit Purchase" : "Record New Purchase"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPurchase
                      ? "Update the purchase information below."
                      : "Enter the details for the new milk purchase."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Supplier</Label>
                    <select
                      id="supplierId"
                      {...register("supplierId", { required: "Supplier is required" })}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplierId && (
                      <p className="text-sm text-destructive">{errors.supplierId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register("date", { required: "Date is required" })}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantityLiters">Quantity (Liters)</Label>
                    <Input
                      id="quantityLiters"
                      type="number"
                      step="0.01"
                      {...register("quantityLiters", { required: "Quantity is required", min: 0 })}
                    />
                    {errors.quantityLiters && (
                      <p className="text-sm text-destructive">{errors.quantityLiters.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerLiter">Price Per Liter</Label>
                    <Input
                      id="pricePerLiter"
                      type="number"
                      step="0.01"
                      {...register("pricePerLiter", { required: "Price per liter is required", min: 0 })}
                    />
                    {errors.pricePerLiter && (
                      <p className="text-sm text-destructive">{errors.pricePerLiter.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      {...register("total", { required: "Total is required", min: 0 })}
                      readOnly
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          {editingPurchase ? "Updating..." : "Creating..."}
                        </>
                      ) : editingPurchase ? (
                        "Update Purchase"
                      ) : (
                        "Create Purchase"
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
            placeholder="Search purchases..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Purchases List */}
        {isLoading ? (
          <div className="py-16 text-center">Loading...</div>
        ) : filteredPurchases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No purchases found matching your search."
                  : "No milk purchases recorded yet."}
              </p>
              {!searchTerm && canEdit && (
                <Button
                  variant="outline"
                  onClick={handleNewPurchase}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Record Your First Purchase
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {purchase.supplier?.name || `Supplier #${purchase.supplierId}`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Date: {format(new Date(purchase.date), "yyyy-MM-dd")}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Quantity: {purchase.quantityLiters} L
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Price: ${purchase.pricePerLiter} / L
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Total: ${purchase.total}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <DropdownMenu
                        open={openPurchaseMenu === purchase.id}
                        onOpenChange={(open) => setOpenPurchaseMenu(open ? purchase.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleEdit(purchase); setOpenPurchaseMenu(null); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { handleDelete(purchase.id); setOpenPurchaseMenu(null); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
