export type Role = "admin" | "user";
export type OrderStatus = "pending" | "completed" | "cancelled";

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
  };
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  code: string;
  title: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
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

export interface DashboardOverview {
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: Array<{ status: OrderStatus; count: number }>;
  dailySeries: Array<{ day: string; count: number }>;
}
