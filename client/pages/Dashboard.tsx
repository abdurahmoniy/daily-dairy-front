import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Users,
  Package,
  Milk,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { apiClient } from "@/lib/api";
import { DashboardSummary, MilkPurchase, Sale } from "@shared/api";
import { format } from "date-fns";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiClient.getDashboardSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const summaryCards = [
    {
      title: "Total Suppliers",
      value: summary?.suppliers || 0,
      icon: Truck,
      description: "Active suppliers",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Customers",
      value: summary?.customers || 0,
      icon: Users,
      description: "Registered customers",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Products",
      value: summary?.products || 0,
      icon: Package,
      description: "Available products",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `$${summary?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      description: "This month",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your dairy business.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </Button>
            <Button className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Milk Purchases */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Recent Milk Purchases
                  </CardTitle>
                  <CardDescription>
                    Latest milk procurement activities
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/milk-purchases">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary?.recentMilkPurchases
                ?.slice(0, 5)
                .map((purchase: MilkPurchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-accent/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Milk className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {purchase.supplier?.name ||
                            `Supplier #${purchase.supplierId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(purchase.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ${purchase.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {purchase.quantityLiters}L
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    No recent milk purchases
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Sales</CardTitle>
                  <CardDescription>Latest sales transactions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/sales">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary?.recentSales?.slice(0, 5).map((sale: Sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {sale.customer?.name || `Customer #${sale.customerId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ${sale.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.quantity} {sale.product?.unit || "units"}
                    </p>
                  </div>
                </div>
              )) || (
                  <p className="text-center text-muted-foreground py-8">
                    No recent sales
                  </p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/milk-purchases">
                  <Milk className="h-6 w-6" />
                  <span className="text-sm">Record Purchase</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/sales">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm">New Sale</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/suppliers">
                  <Truck className="h-6 w-6" />
                  <span className="text-sm">Add Supplier</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/customers">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Add Customer</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
