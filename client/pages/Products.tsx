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
import { CreateProductRequest, Product } from "@shared/api";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser } = useUser();
  const canEdit = currentUser && ["ADMIN", "MANAGER"].includes(currentUser.role);
  const [openProductMenu, setOpenProductMenu] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateProductRequest>({
    defaultValues: {
      name: "",
      unit: "",
      pricePerUnit: 0,
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewProduct = () => {
    setEditingProduct(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue("name", product.name);
    setValue("unit", product.unit);
    setValue("pricePerUnit", product.pricePerUnit);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete product");
    }
  };

  const onSubmit = async (data: CreateProductRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      if (editingProduct) {
        const updated = await apiClient.updateProduct(editingProduct.id, data);
        setProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)));
      } else {
        const created = await apiClient.createProduct(data);
        setProducts([...products, created]);
      }
      setIsDialogOpen(false);
      reset();
      setEditingProduct(null);
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
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and pricing.
            </p>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewProduct} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? "Update the product information below."
                      : "Enter the details for the new product."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      {...register("name", { required: "Product name is required" })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="Enter unit (e.g. Liter, Kg, Piece)"
                      {...register("unit", { required: "Unit is required" })}
                    />
                    {errors.unit && (
                      <p className="text-sm text-destructive">{errors.unit.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price Per Unit</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      placeholder="Enter price per unit"
                      {...register("pricePerUnit", { required: "Price per unit is required", min: 0 })}
                    />
                    {errors.pricePerUnit && (
                      <p className="text-sm text-destructive">{errors.pricePerUnit.message}</p>
                    )}
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
                          {editingProduct ? "Updating..." : "Creating..."}
                        </>
                      ) : editingProduct ? (
                        "Update Product"
                      ) : (
                        "Create Product"
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
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Products List */}
        {isLoading ? (
          <div className="py-16 text-center">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No products found matching your search."
                  : "No products added yet."}
              </p>
              {!searchTerm && canEdit && (
                <Button
                  variant="outline"
                  onClick={handleNewProduct}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Unit: {product.unit}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        Price: ${product.pricePerUnit}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <DropdownMenu
                        open={openProductMenu === product.id}
                        onOpenChange={(open) => setOpenProductMenu(open ? product.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleEdit(product); setOpenProductMenu(null); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { handleDelete(product.id); setOpenProductMenu(null); }}
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
