export type Role = "admin" | "user";

export interface Database {
  public: {
    Tables: {
      people: {
        Row: {
          id: string;
          address: string | null;
          email: string | null;
          password: string | null;
          name: string | null;
          city: string | null;
          state: string | null;
          source: string | null;
          birth_date: string | null;
          zip: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          address?: string | null;
          email?: string | null;
          password?: string | null;
          name?: string | null;
          city?: string | null;
          state?: string | null;
          source?: string | null;
          birth_date?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          email?: string | null;
          password?: string | null;
          name?: string | null;
          city?: string | null;
          state?: string | null;
          source?: string | null;
          birth_date?: string | null;
          zip?: string | null;
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
          product_id: string;
          subtotal: number;
          tax: number;
          total: number;
          discount: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          subtotal?: number;
          tax?: number;
          discount?: number;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          discount?: number;
          quantity?: number;
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
