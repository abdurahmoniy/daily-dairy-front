import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Milk,
  Package,
  Shield,
  ShoppingCart,
  Truck,
  User,
  Users
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Boshqaruv paneli", href: "/dashboard", icon: LayoutDashboard },
  { name: "Yetkazib beruvchilar", href: "/suppliers", icon: Truck },
  { name: "Mijozlar", href: "/customers", icon: Users },
  { name: "Mahsulotlar", href: "/products", icon: Package },
  { name: "Sut xaridlari", href: "/milk-purchases", icon: Milk },
  { name: "Sotuvlar", href: "/sales", icon: ShoppingCart },
  // { name: "Hisobotlar", href: "/reports", icon: BarChart3 },
];

const adminNavigation = [
  { name: "Foydalanuvchilarni boshqarish", href: "/users", icon: User },
  { name: "Admin sessiyalari", href: "/admin-sessions", icon: Shield },
  // { name: "Tizim sozlamalari", href: "/settings", icon: Settings },
];

// Mobile bottom navigation items (limited to 5 most important)
const mobileNavigation = [
  { name: "Boshqaruv", href: "/dashboard", icon: LayoutDashboard },
  { name: "Yetkazuvchilar", href: "/suppliers", icon: Truck },
  { name: "Mijozlar", href: "/customers", icon: Users },
  { name: "Sut xaridlari", href: "/milk-purchases", icon: Milk },
  { name: "Sotuvlar", href: "/sales", icon: ShoppingCart },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="p-2 bg-sidebar-primary rounded-xl">
          <Milk className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">
            DailyDairy
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Sut mahsulotlari boshqaruvi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActiveRoute(item.href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}

        {user?.role === "ADMIN" && (
          <>
            <div className="h-px bg-sidebar-border my-4" />
            <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Administratsiya
            </div>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActiveRoute(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-sidebar-foreground/60">{user?.role === "ADMIN" ? "Admin" : user?.role === "MANAGER" ? "Menejer" : "Foydalanuvchi"}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )} style={{ transition: 'opacity 0.3s' }}>
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ willChange: 'transform' }}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Milk className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">DailyDairy</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                  isActiveRoute(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                {isActiveRoute(item.href) && (
                  <span className="text-xs font-medium truncate mt-1">{item.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
