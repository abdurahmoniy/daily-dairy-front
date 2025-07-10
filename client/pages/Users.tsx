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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/api";
import { RegisterRequest, User } from "@shared/api";
import { Edit, Loader2, Plus, Search, Settings, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const ROLES = ["ADMIN", "MANAGER", "USER"];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [roleValue, setRoleValue] = useState<string>("");
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [openUserMenu, setOpenUserMenu] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegisterRequest>({
    defaultValues: {
      username: "",
      password: "",
      role: "USER",
    },
  });

  useEffect(() => {
    if (currentUser && currentUser.role === "ADMIN") {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewUser = () => {
    setEditingUser(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleEditRole = (user: User) => {
    setRoleUser(user);
    setRoleValue(user.role);
    setRoleDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!currentUser || currentUser.role !== "ADMIN") return;
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  const onSubmit = async (data: RegisterRequest) => {
    setIsSubmitting(true);
    setError("");
    try {
      // Only ADMIN can add users
      if (!currentUser || currentUser.role !== "ADMIN") return;
      const created = await apiClient.register(data);
      setUsers([...users, created.user]);
      setIsDialogOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleUser) return;
    try {
      await apiClient.updateUserRole(roleUser.id, roleValue);
      setUsers(users.map((u) => (u.id === roleUser.id ? { ...u, role: roleValue as User["role"] } : u)));
      setRoleDialogOpen(false);
      setRoleUser(null);
    } catch (err) {
      setError("Failed to update user role");
    }
  };

  if (isUserLoading) return null;
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-destructive text-lg font-semibold">
          Forbidden: Only ADMIN can access this page.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Foydalanuvchilarni boshqarish
            </h1>
            <p className="text-muted-foreground">
              Tizim foydalanuvchilari va ularning ruxsatlarini boshqaring.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Faqat admin
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={fetchUsers}>
              <Settings className="h-4 w-4" />
              Yangilash
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewUser} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Foydalanuvchi qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Yangi foydalanuvchi qo'shish
                  </DialogTitle>
                  <DialogDescription>
                    Yangi foydalanuvchi uchun ma'lumotlarni kiriting.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username">Foydalanuvchi nomi</Label>
                    <Input
                      id="username"
                      placeholder="Foydalanuvchi nomini kiriting"
                      {...register("username", { required: "Foydalanuvchi nomi majburiy" })}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Parol</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Parolni kiriting"
                      {...register("password", { required: "Parol majburiy" })}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <select
                      id="role"
                      {...register("role", { required: "Rol majburiy" })}
                      className="w-full border rounded p-2"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {errors.role && (
                      <p className="text-sm text-destructive">{errors.role.message}</p>
                    )}
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
                      {isSubmitting ? "Yaratilmoqda..." : "Foydalanuvchini yaratish"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Foydalanuvchilarni qidiring..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Users List */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Qidiruv bo'yicha foydalanuvchi topilmadi."
                  : "Tizimda hali foydalanuvchilar yo'q."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Badge>{user.role}</Badge>
                      </CardDescription>
                    </div>
                    <DropdownMenu
                      open={openUserMenu === user.id}
                      onOpenChange={(open) => setOpenUserMenu(open ? user.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { handleEditRole(user); setOpenUserMenu(null); }}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { handleDelete(user.id); setOpenUserMenu(null); }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        {/* Edit Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for this user.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onRoleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleSelect">Role</Label>
                <select
                  id="roleSelect"
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Role</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
