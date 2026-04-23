export type Role = "admin" | "user";
export type OrderStatus = "pending" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: Role;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
          updated_at?: string;
        };
      };
      people: {
        Row: {
          id: string;
          address: string | null;
          email: string | null;
          password: string | null;
          name: string | null;
          city: string | null;
          longitude: number | null;
          state: string | null;
          source: string | null;
          birth_date: string | null;
          zip: string | null;
          latitude: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          address?: string | null;
          email?: string | null;
          password?: string | null;
          name?: string | null;
          city?: string | null;
          longitude?: number | null;
          state?: string | null;
          source?: string | null;
          birth_date?: string | null;
          zip?: string | null;
          latitude?: number | null;
        };
        Update: {
          address?: string | null;
          email?: string | null;
          password?: string | null;
          name?: string | null;
          city?: string | null;
          longitude?: number | null;
          state?: string | null;
          source?: string | null;
          birth_date?: string | null;
          zip?: string | null;
          latitude?: number | null;
        };
      };
      products: {
        Row: {
          id: string;
          ean: string;
          title: string;
          category: string | null;
          vendor: string | null;
          price: number;
          rating: number;
          created_at: string;
        };
        Insert: {
          ean: string;
          title: string;
          category?: string | null;
          vendor?: string | null;
          price: number;
          rating?: number;
        };
        Update: {
          ean?: string;
          title?: string;
          category?: string | null;
          vendor?: string | null;
          price?: number;
          rating?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          subtotal: number;
          tax: number;
          total: number;
          discount: number;
          quantity: number;
          code: string;
          title: string;
          amount: number;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          product_id?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          discount?: number;
          quantity?: number;
          code: string;
          title: string;
          amount: number;
          status?: OrderStatus;
        };
        Update: {
          product_id?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          discount?: number;
          quantity?: number;
          title?: string;
          amount?: number;
          status?: OrderStatus;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          reviewer: string;
          rating: number;
          body: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          reviewer: string;
          rating: number;
          body?: string | null;
        };
        Update: {
          reviewer?: string;
          rating?: number;
          body?: string | null;
        };
      };
    };
  };
}
