import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getDailyWorkMobileNavigation } from "@/lib/daily-work";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Milk,
  MoreHorizontal,
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

const navigationSections = [
  {
    title: "Kunlik ishlar",
    items: [
      { name: "Boshqaruv paneli", href: "/dashboard", icon: LayoutDashboard },
      { name: "Sut xaridi", href: "/milk-purchases", icon: Milk },
      { name: "Sotuv", href: "/sales", icon: ShoppingCart },
    ],
  },
  {
    title: "Tahlil",
    items: [
      { name: "Dashboard", href: "/analytics-dashboard", icon: BarChart3 },
    ],
  },
  {
    title: "Ma'lumotlar",
    items: [
      { name: "Mijozlar", href: "/customers", icon: Users },
      { name: "Yetkazib beruvchilar", href: "/suppliers", icon: Truck },
      { name: "Mahsulotlar", href: "/products", icon: Package },
    ],
  },
];

const adminNavigation = [
  { name: "Foydalanuvchilarni boshqarish", href: "/users", icon: User },
  { name: "Admin sessiyalari", href: "/admin-sessions", icon: Shield },
  // { name: "Tizim sozlamalari", href: "/settings", icon: Settings },
];

const mobileIconMap = {
  Boshqaruv: LayoutDashboard,
  Xarid: Milk,
  Sotuv: ShoppingCart,
  Mijozlar: Users,
  "Ko'proq": MoreHorizontal,
};

const mobileNavigation = getDailyWorkMobileNavigation().map((item) => ({
  ...item,
  icon: mobileIconMap[item.name as keyof typeof mobileIconMap],
}));

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
      <nav className="flex-1 px-4 py-6 space-y-5">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/60">
              {section.title}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActiveRoute(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>
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
      )} style={{ transition: 'opacity 0.3s' }} aria-hidden={!sidebarOpen}>
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
              item.href ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 transition-colors",
                    isActiveRoute(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="mt-1 text-[11px] font-medium">{item.name}</span>
                </Link>
              ) : (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="mt-1 text-[11px] font-medium">{item.name}</span>
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
