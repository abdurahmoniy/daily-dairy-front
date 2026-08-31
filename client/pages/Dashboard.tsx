import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";
import { formatDailyProductSales, getControlPanelActions } from "@/lib/control-panel";
import { formatCurrencyPlain } from "@/lib/entry-defaults";
import { DashboardData } from "@shared/api";
import { format } from "date-fns";
import { BarChart3, Milk, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const actionIcons = {
  "Sut xaridi yozish": Milk,
  "Sotuv yozish": ShoppingCart,
  Dashboard: BarChart3,
};

function formatVolume(liters: number) {
  return `${Number(liters || 0).toFixed(1)} litr`;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTodayData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const data = await apiClient.getDashboardData(today, today);
        setDashboardData(data);
      } catch (err) {
        setDashboardData(null);
        setError("Bugungi ko'rsatkichlarni yuklab bo'lmadi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  const productSales = useMemo(
    () => formatDailyProductSales(dashboardData?.productBreakdown || []),
    [dashboardData],
  );

  const actions = getControlPanelActions();

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Bugungi ish</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Boshqaruv paneli
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Tez kiritiladigan yozuvlar va bugungi asosiy holat.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = actionIcons[action.label as keyof typeof actionIcons] || Plus;
            const isPrimary = index === 0;

            return (
              <Button
                key={action.href}
                asChild
                variant={isPrimary ? "default" : "outline"}
                className="h-14 justify-start gap-3 rounded-xl px-4 text-base"
              >
                <Link to={action.href} state={action.openForm ? { openForm: true } : undefined}>
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bugungi sut xaridi</p>
                  {isLoading ? (
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
                        {formatVolume(dashboardData?.summary.totalMilkPurchased || 0)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrencyPlain(dashboardData?.summary.totalPurchaseCost || 0)} xarajat
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Milk className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Bugungi sotuv</p>
                  {isLoading ? (
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
                        {formatCurrencyPlain(dashboardData?.summary.totalSalesRevenue || 0)}
                      </p>
                      {productSales.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {productSales.map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                {item.label}
                              </span>
                              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">Bugun sotuv yozilmagan.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
