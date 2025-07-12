import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Activity, Calendar, DollarSign, Package, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardLayout } from '../components/layout/dashboard-layout';

interface DashboardData {
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalMilkPurchased: number;
    totalMilkSold: number;
    totalPurchaseCost: number;
    totalSalesRevenue: number;
    grossProfit: number;
  };
  purchasesOverTime: Array<{
    date: string;
    totalLiters: number;
  }>;
  salesOverTime: Array<{
    date: string;
    totalLiters: number;
  }>;
  supplierBreakdown: Array<{
    supplierId: number;
    supplierName: string;
    totalLitersSupplied: number;
    totalCost: number;
  }>;
  customerBreakdown: Array<{
    customerId: number;
    customerName: string;
    totalLitersBought: number;
    totalRevenue: number;
  }>;
  productBreakdown: Array<{
    productId: number;
    productName: string;
    unitsSold: number;
    totalRevenue: number;
  }>;
}

interface AllTimeData {
  summary: {
    totalMilkPurchased: number;
    totalMilkSold: number;
    totalPurchaseCost: number;
    totalSalesRevenue: number;
    grossProfit: number;
  };
  supplierBreakdown: Array<{
    supplierId: number;
    supplierName: string;
    totalLitersSupplied: number;
    totalCost: number;
    totalTransactions: number;
    averagePricePerLiter: number;
  }>;
  customerBreakdown: Array<{
    customerId: number;
    customerName: string;
    totalLitersBought: number;
    totalRevenue: number;
    totalTransactions: number;
    averagePricePerLiter: number;
  }>;
  productBreakdown: Array<{
    productId: number;
    productName: string;
    unitsSold: number;
    totalRevenue: number;
    totalTransactions: number;
    averagePricePerUnit: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    purchases: number;
    sales: number;
    purchaseCost: number;
    salesRevenue: number;
    profit: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allTimeData, setAllTimeData] = useState<AllTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [quickActionData, setQuickActionData] = useState<DashboardData | null>(null);
  const [quickActionTitle, setQuickActionTitle] = useState('');
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [tempDateRange, setTempDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchDashboardData();
    fetchAllTimeData();
  }, [dateRange]);

  // Handle clicking outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');

      const data = await apiClient.getDashboardData(from, to);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTimeData = async () => {
    try {
      const data = await apiClient.getAllTimeDashboardData();
      setAllTimeData(data);
    } catch (error) {
      console.error('Error fetching all-time data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
    }).format(amount);
  };

  const formatVolume = (liters: number) => {
    return `${liters.toFixed(1)} L`;
  };

  const formatDateUzbek = (date: Date, formatStr: string) => {
    return format(date, formatStr, { locale: uz });
  };

  const handleDateRangeChange = (item: any) => {
    const { startDate, endDate } = item.selection;

    // Update tempDateRange with the current selection
    setTempDateRange({
      from: startDate || tempDateRange.from,
      to: endDate || startDate || tempDateRange.to,
    });

    // Only update the main dateRange and close picker when both dates are selected
    if (startDate && endDate) {
      setDateRange({
        from: startDate,
        to: endDate,
      });
      setIsDatePickerOpen(false);
    }
  };

  const handleOpenDatePicker = () => {
    setTempDateRange(dateRange); // Initialize temp range with current range
    setIsDatePickerOpen(true);
  };

  const handleQuickAction = async (period: 'today' | 'yesterday' | 'thisMonth' | 'lastMonth') => {
    setQuickActionLoading(true);
    setIsQuickActionModalOpen(true);

    let fromDate: Date, toDate: Date, title: string;

    switch (period) {
      case 'today':
        fromDate = startOfDay(new Date());
        toDate = endOfDay(new Date());
        title = 'Bugun';
        break;
      case 'yesterday':
        fromDate = startOfDay(subDays(new Date(), 1));
        toDate = endOfDay(subDays(new Date(), 1));
        title = 'Kecha';
        break;
      case 'thisMonth':
        fromDate = startOfMonth(new Date());
        toDate = endOfMonth(new Date());
        title = 'Bu oy';
        break;
      case 'lastMonth':
        fromDate = startOfMonth(subMonths(new Date(), 1));
        toDate = endOfMonth(subMonths(new Date(), 1));
        title = 'Oldingi oy';
        break;
    }

    setQuickActionTitle(title);

    try {
      const from = format(fromDate, 'yyyy-MM-dd');
      const to = format(toDate, 'yyyy-MM-dd');
      const data = await apiClient.getDashboardData(from, to);
      setQuickActionData(data);
    } catch (error) {
      console.error('Error fetching quick action data:', error);
    } finally {
      setQuickActionLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boshqaruv paneli</h1>
            <p className="text-muted-foreground">
              Sut mahsulotlari biznesingiz uchun keng qamrovli tahlil va tushunchalar
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleQuickAction('today')}
                className="text-xs"
              >
                Bugun
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleQuickAction('yesterday')}
                className="text-xs"
              >
                Kecha
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleQuickAction('thisMonth')}
                className="text-xs"
              >
                Bu oy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleQuickAction('lastMonth')}
                className="text-xs"
              >
                Oldingi oy
              </Button>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={handleOpenDatePicker}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                {formatDateUzbek(dateRange.from, 'dd MMM')} - {formatDateUzbek(dateRange.to, 'dd MMM yyyy')}
              </button>
              {isDatePickerOpen && (
                <div className="absolute top-16 right-6 z-50 bg-white border border-gray-300 rounded-md shadow-lg" ref={datePickerRef}>
                  <DateRange
                    locale={uz}
                    months={2}
                    showSelectionPreview={true}
                    ranges={[{
                      startDate: tempDateRange.from,
                      endDate: tempDateRange.to,
                      key: 'selection'
                    }]}
                    onChange={handleDateRangeChange}
                    rangeColors={['#0088FE']}
                    showDateDisplay={true}  // Fix: allow editing both from and to easily
                    showMonthAndYearPickers={true}
                    direction="horizontal"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="period" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="period">Davr tahlili</TabsTrigger>
            <TabsTrigger value="all-time">Umumiy tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="period" className="space-y-6">
            {dashboardData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Jami sut sotib olingan</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatVolume(dashboardData.summary.totalMilkPurchased)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(dashboardData.summary.totalPurchaseCost)} umumiy xarajat
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Jami sut sotilgan</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatVolume(dashboardData.summary.totalMilkSold)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(dashboardData.summary.totalSalesRevenue)} umumiy daromad
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Yalpi foyda</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(dashboardData.summary.grossProfit)}</div>
                      <p className="text-xs text-muted-foreground">
                        {((dashboardData.summary.grossProfit / dashboardData.summary.totalSalesRevenue) * 100).toFixed(1)}% marja
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sana oralig'i</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {formatDateUzbek(dateRange.from, 'MMM dd')} - {formatDateUzbek(dateRange.to, 'MMM dd, yyyy')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} kun
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vaqt bo'yicha hajm</CardTitle>
                      <CardDescription>Kunlik sut sotib olish va sotish</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.purchasesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd')}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd, yyyy')}
                            formatter={(value: number) => [formatVolume(value), 'Litr']}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalLiters"
                            stroke="#0088FE"
                            strokeWidth={2}
                            name="Sotib olish"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vaqt bo'yicha sotish</CardTitle>
                      <CardDescription>Kunlik sut sotish hajmi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.salesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd')}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd, yyyy')}
                            formatter={(value: number) => [formatVolume(value), 'Litr']}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalLiters"
                            stroke="#00C49F"
                            strokeWidth={2}
                            name="Sotish"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Yetkazib beruvchilar tahlili
                      </CardTitle>
                      <CardDescription>Jami yetkazib berilgan litr va xarajatlar</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.supplierBreakdown.map((supplier, index) => (
                          <div key={supplier.supplierId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-sm font-medium">{supplier.supplierName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatVolume(supplier.totalLitersSupplied)}</div>
                              <div className="text-xs text-muted-foreground">{formatCurrency(supplier.totalCost)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Mijozlar tahlili
                      </CardTitle>
                      <CardDescription>Jami sotib olingan litr va daromad</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.customerBreakdown.map((customer, index) => (
                          <div key={customer.customerId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-sm font-medium">{customer.customerName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatVolume(customer.totalLitersBought)}</div>
                              <div className="text-xs text-muted-foreground">{formatCurrency(customer.totalRevenue)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Mahsulotlar tahlili
                      </CardTitle>
                      <CardDescription>Sotilgan birliklar va daromad</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.productBreakdown.map((product, index) => (
                          <div key={product.productId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-sm font-medium">{product.productName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatVolume(product.unitsSold)}</div>
                              <div className="text-xs text-muted-foreground">{formatCurrency(product.totalRevenue)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="all-time" className="space-y-6">
            {allTimeData && (
              <>
                {/* All-Time Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Jami sut sotib olingan</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatVolume(allTimeData.summary.totalMilkPurchased)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(allTimeData.summary.totalPurchaseCost)} umumiy xarajat
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Jami sut sotilgan</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatVolume(allTimeData.summary.totalMilkSold)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(allTimeData.summary.totalSalesRevenue)} umumiy daromad
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Yalpi foyda</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(allTimeData.summary.grossProfit)}</div>
                      <p className="text-xs text-muted-foreground">
                        {((allTimeData.summary.grossProfit / allTimeData.summary.totalSalesRevenue) * 100).toFixed(1)}% marja
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Umumiy vaqt</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">Umumiy statistika</div>
                      <p className="text-xs text-muted-foreground">
                        To'liq biznes tarixi
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Oylik tendentsiyalar (So'nggi 12 oy)</CardTitle>
                    <CardDescription>Oylik sotib olish, sotish va foyda tendentsiyalari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={allTimeData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(value) => formatDateUzbek(new Date(value + '-01'), 'MMM yyyy')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDateUzbek(new Date(value + '-01'), 'MMMM yyyy')}
                          formatter={(value: number, name: string) => [
                            name === 'purchases' || name === 'sales' ? formatVolume(value) : formatCurrency(value),
                            name === 'purchases' ? 'Sotib olish' :
                              name === 'sales' ? 'Sotish' :
                                name === 'purchaseCost' ? 'Sotib olish xarajati' :
                                  name === 'salesRevenue' ? 'Sotish daromadi' : 'Foyda'
                          ]}
                        />
                        <Bar dataKey="purchases" fill="#0088FE" name="Sotib olish" />
                        <Bar dataKey="sales" fill="#00C49F" name="Sotish" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Detailed Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Yetkazib beruvchilar natijalari
                      </CardTitle>
                      <CardDescription>Umumiy yetkazib beruvchilar statistikasi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allTimeData.supplierBreakdown.map((supplier, index) => (
                          <div key={supplier.supplierId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm font-medium">{supplier.supplierName}</span>
                              </div>
                              <Badge variant="secondary">{supplier.totalTransactions} operatsiya</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Hajm:</span>
                                <div className="font-medium">{formatVolume(supplier.totalLitersSupplied)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Xarajat:</span>
                                <div className="font-medium">{formatCurrency(supplier.totalCost)}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">O'rtacha narx/litr:</span>
                                <div className="font-medium">{formatCurrency(supplier.averagePricePerLiter)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Mijozlar natijalari
                      </CardTitle>
                      <CardDescription>Umumiy mijozlar statistikasi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allTimeData.customerBreakdown.map((customer, index) => (
                          <div key={customer.customerId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm font-medium">{customer.customerName}</span>
                              </div>
                              <Badge variant="secondary">{customer.totalTransactions} operatsiya</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Hajm:</span>
                                <div className="font-medium">{formatVolume(customer.totalLitersBought)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Daromad:</span>
                                <div className="font-medium">{formatCurrency(customer.totalRevenue)}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">O'rtacha narx/litr:</span>
                                <div className="font-medium">{formatCurrency(customer.averagePricePerLiter)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Mahsulotlar natijalari
                      </CardTitle>
                      <CardDescription>Umumiy mahsulotlar statistikasi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allTimeData.productBreakdown.map((product, index) => (
                          <div key={product.productId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm font-medium">{product.productName}</span>
                              </div>
                              <Badge variant="secondary">{product.totalTransactions} operatsiya</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Birliklar:</span>
                                <div className="font-medium">{formatVolume(product.unitsSold)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Daromad:</span>
                                <div className="font-medium">{formatCurrency(product.totalRevenue)}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">O'rtacha narx/birlik:</span>
                                <div className="font-medium">{formatCurrency(product.averagePricePerUnit)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Action Modal */}
      <Dialog open={isQuickActionModalOpen} onOpenChange={setIsQuickActionModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{quickActionTitle} statistikasi</DialogTitle>
            <DialogDescription>
              {quickActionData && (
                <span>
                  {formatDateUzbek(new Date(quickActionData.dateRange.from), 'dd MMMM yyyy')} - {formatDateUzbek(new Date(quickActionData.dateRange.to), 'dd MMMM yyyy')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {quickActionLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : quickActionData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jami sut sotib olingan</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatVolume(quickActionData.summary.totalMilkPurchased)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(quickActionData.summary.totalPurchaseCost)} umumiy xarajat
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jami sut sotilgan</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatVolume(quickActionData.summary.totalMilkSold)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(quickActionData.summary.totalSalesRevenue)} umumiy daromad
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Yalpi foyda</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(quickActionData.summary.grossProfit)}</div>
                    <p className="text-xs text-muted-foreground">
                      {((quickActionData.summary.grossProfit / quickActionData.summary.totalSalesRevenue) * 100).toFixed(1)}% marja
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sana oralig'i</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {formatDateUzbek(new Date(quickActionData.dateRange.from), 'MMM dd')} - {formatDateUzbek(new Date(quickActionData.dateRange.to), 'MMM dd, yyyy')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((new Date(quickActionData.dateRange.to).getTime() - new Date(quickActionData.dateRange.from).getTime()) / (1000 * 60 * 60 * 24))} kun
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vaqt bo'yicha hajm</CardTitle>
                    <CardDescription>Kunlik sut sotib olish va sotish</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={quickActionData.purchasesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd, yyyy')}
                          formatter={(value: number) => [formatVolume(value), 'Litr']}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalLiters"
                          stroke="#0088FE"
                          strokeWidth={2}
                          name="Sotib olish"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vaqt bo'yicha sotish</CardTitle>
                    <CardDescription>Kunlik sut sotish hajmi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={quickActionData.salesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDateUzbek(new Date(value), 'MMM dd, yyyy')}
                          formatter={(value: number) => [formatVolume(value), 'Litr']}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalLiters"
                          stroke="#00C49F"
                          strokeWidth={2}
                          name="Sotish"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Yetkazib beruvchilar tahlili
                    </CardTitle>
                    <CardDescription>Jami yetkazib berilgan litr va xarajatlar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {quickActionData.supplierBreakdown.map((supplier, index) => (
                        <div key={supplier.supplierId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{supplier.supplierName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatVolume(supplier.totalLitersSupplied)}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(supplier.totalCost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Mijozlar tahlili
                    </CardTitle>
                    <CardDescription>Jami sotib olingan litr va daromad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {quickActionData.customerBreakdown.map((customer, index) => (
                        <div key={customer.customerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{customer.customerName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatVolume(customer.totalLitersBought)}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(customer.totalRevenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Mahsulotlar tahlili
                    </CardTitle>
                    <CardDescription>Sotilgan birliklar va daromad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {quickActionData.productBreakdown.map((product, index) => (
                        <div key={product.productId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{product.productName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatVolume(product.unitsSold)}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(product.totalRevenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
