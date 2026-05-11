export type Role = "admin" | "user";

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    role?: Role;
  };
}

export interface Profile {
  id: string;
  address: string | null;
  email: string | null;
  password?: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  birth_date: string | null;
  zip: string | null;
  created_at: string;
  role?: Role;
}

export type Customer = Profile;

export interface Product {
  id: string;
  ean: string;
  title: string;
  category: string | null;
  vendor: string | null;
  price: number;
  rating: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  quantity: number;
  title?: string;
  amount?: number;
  product?: Product | null;
  person?: Pick<Profile, "id" | "name" | "email"> | null;
  created_at: string;
}

export interface PaginatedOrders {
  items: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedCustomers {
  items: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOverview {
  totalOrders: number;
  totalRevenue: number;
  totalQuantity: number;
  averageOrderValue: number;
  dailySeries: Array<{ day: string; count: number }>;
}

export interface OrderSummary {
  total: number;
  totalSpent: number;
  totalQuantity: number;
  averageOrderValue: number;
}
