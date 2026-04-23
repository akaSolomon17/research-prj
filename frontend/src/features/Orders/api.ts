import { request } from "@/shared/api/http";
import type { Order, OrderStatus, PaginatedOrders } from "@/shared/types/models";

interface OrderQuery {
  page: number;
  limit: number;
  search: string;
  status: "all" | OrderStatus;
}

interface OrderMutationInput {
  title: string;
  amount: number;
  status: OrderStatus;
}

const toSearchParams = (query: OrderQuery) => {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.search.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.status !== "all") {
    params.set("status", query.status);
  }
  return params.toString();
};

export const fetchOrders = (accessToken: string, query: OrderQuery) =>
  request<PaginatedOrders>(`/api/v1/orders?${toSearchParams(query)}`, {
    method: "GET",
    accessToken,
  });

export const createOrder = (accessToken: string, payload: OrderMutationInput) =>
  request<Order>("/api/v1/orders", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });

export const updateOrder = (accessToken: string, id: string, payload: OrderMutationInput) =>
  request<Order>(`/api/v1/orders/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });

export const deleteOrder = (accessToken: string, id: string) =>
  request<void>(`/api/v1/orders/${id}`, {
    method: "DELETE",
    accessToken,
  });
