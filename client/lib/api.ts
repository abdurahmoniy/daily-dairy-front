import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  MilkPurchase,
  CreateMilkPurchaseRequest,
  UpdateMilkPurchaseRequest,
  Sale,
  CreateSaleRequest,
  UpdateSaleRequest,
  DashboardSummary,
  ApiError,
} from "@shared/api";

const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = "https://daily-dairy-backend-production.up.railway.app/api";

// Dashboard data interfaces
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

class ApiClient {
  public getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("dairy_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    const res = await this.request<any>("/users");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.users)) return res.users;
    if (res && res.user) return [res.user];
    if (res && typeof res === 'object') return [res];
    return [];
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/users/me");
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    return this.request<User>(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    return this.request<void>(`/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await this.request<any>("/suppliers");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.suppliers)) return res.suppliers;
    // If backend returns an object with a single supplier, wrap it in an array
    if (res && res.supplier) return [res.supplier];
    // If backend returns a single object, wrap it in an array
    if (res && typeof res === 'object') return [res];
    return [];
  }

  async getSupplierById(id: number): Promise<Supplier> {
    const res = await this.request<any>(`/suppliers/${id}`);
    // If response is { supplier: {...} }, unwrap it
    if (res && res.supplier) return res.supplier;
    return res;
  }

  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const res = await this.request<any>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res && res.supplier) return res.supplier;
    return res;
  }

  async updateSupplier(
    id: number,
    data: UpdateSupplierRequest,
  ): Promise<Supplier> {
    const res = await this.request<any>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (res && res.supplier) return res.supplier;
    return res;
  }

  async deleteSupplier(id: number): Promise<void> {
    return this.request<void>(`/suppliers/${id}`, {
      method: "DELETE",
    });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await this.request<any>("/customers");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.customers)) return res.customers;
    if (res && res.customer) return [res.customer];
    if (res && typeof res === 'object') return [res];
    return [];
  }

  async getCustomerById(id: number): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(
    id: number,
    data: UpdateCustomerRequest,
  ): Promise<{ customer: Customer }> {
    return this.request<{ customer: Customer }>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteCustomer(id: number): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: "DELETE",
    });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await this.request<any>("/products");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.products)) return res.products;
    return [];
  }

  async getProductById(id: number): Promise<Product> {
    const res = await this.request<any>(`/products/${id}`);
    if (res && res.product) return res.product;
    return res;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const res = await this.request<any>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res && res.product) return res.product;
    return res;
  }

  async updateProduct(
    id: number,
    data: UpdateProductRequest,
  ): Promise<Product> {
    const res = await this.request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (res && res.product) return res.product;
    return res;
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Milk Purchases
  async getMilkPurchases(): Promise<MilkPurchase[]> {
    return this.request<MilkPurchase[]>("/milk-purchases");
  }

  async getMilkPurchaseById(id: number): Promise<MilkPurchase> {
    return this.request<MilkPurchase>(`/milk-purchases/${id}`);
  }

  async createMilkPurchase(
    data: CreateMilkPurchaseRequest,
  ): Promise<MilkPurchase> {
    return this.request<MilkPurchase>("/milk-purchases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMilkPurchase(
    id: number,
    data: UpdateMilkPurchaseRequest,
  ): Promise<MilkPurchase> {
    return this.request<MilkPurchase>(`/milk-purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMilkPurchase(id: number): Promise<void> {
    return this.request<void>(`/milk-purchases/${id}`, {
      method: "DELETE",
    });
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return this.request<Sale[]>("/sales");
  }

  async getSaleById(id: number): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  async createSale(data: CreateSaleRequest): Promise<Sale> {
    return this.request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSale(id: number, data: UpdateSaleRequest): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSale(id: number): Promise<void> {
    return this.request<void>(`/sales/${id}`, {
      method: "DELETE",
    });
  }

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/dashboard/summary");
  }

  async getDashboardData(fromDate: string, toDate: string): Promise<DashboardData> {
    return this.request<DashboardData>(`/dashboard?from=${fromDate}&to=${toDate}`);
  }

  async getAllTimeDashboardData(): Promise<AllTimeData> {
    return this.request<AllTimeData>("/dashboard/all-time");
  }
}

export const apiClient = new ApiClient();
