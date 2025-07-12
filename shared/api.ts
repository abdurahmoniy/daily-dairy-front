// User types
export interface User {
  id: number;
  username: string;
  role: "ADMIN" | "MANAGER" | "USER";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: "ADMIN" | "MANAGER" | "USER";
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Supplier types
export interface Supplier {
  id: number;
  name: string;
  phone: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  phone?: string;
  notes?: string;
}

// Customer types
export interface Customer {
  id: number;
  name: string;
  type: string;
  phone: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  type: string;
  phone: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  type?: string;
  phone?: string;
  notes?: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  unit: string;
  pricePerUnit: number;
}

export interface UpdateProductRequest {
  name?: string;
  unit?: string;
  pricePerUnit?: number;
}

// Milk Purchase types
export interface MilkPurchase {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  date: string;
  quantityLiters: number;
  pricePerLiter: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMilkPurchaseRequest {
  supplierId: number;
  date: string;
  quantityLiters: number;
  pricePerLiter: number;
  total: number;
}

export interface UpdateMilkPurchaseRequest {
  supplierId?: number;
  date?: string;
  quantityLiters?: number;
  pricePerLiter?: number;
  total?: number;
}

// Sale types
export interface Sale {
  id: number;
  customerId: number;
  customer?: Customer;
  productId: number;
  product?: Product;
  date: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSaleRequest {
  customerId: number;
  productId: number;
  date: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface UpdateSaleRequest {
  customerId?: number;
  productId?: number;
  date?: string;
  quantity?: number;
  pricePerUnit?: number;
  total?: number;
}

// Dashboard types
export interface DashboardSummary {
  suppliers: number;
  customers: number;
  products: number;
  milkPurchases: number;
  sales: number;
  totalRevenue: number;
  totalMilkPurchased: number;
  recentMilkPurchases: MilkPurchase[];
  recentSales: Sale[];
}

export interface DashboardData {
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
    totalKg: number;
    totalUnits: number;
    totalQuantity: number;
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
    productUnit?: string;
    unitsSold: number;
    totalRevenue: number;
  }>;
}

export interface AllTimeData {
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
    productUnit?: string;
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

// API Error types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
