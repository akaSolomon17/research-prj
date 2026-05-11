import { request } from "@/shared/api/http";
import type { Customer, PaginatedCustomers } from "@/shared/types/models";

interface CustomerQuery {
  page: number;
  limit: number;
  search: string;
}

interface CustomerMutationInput {
  name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string;
  birthDate?: string;
  password?: string;
}

const toSearchParams = (query: CustomerQuery) => {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.search.trim()) {
    params.set("search", query.search.trim());
  }
  return params.toString();
};

export const fetchCustomers = (accessToken: string, query: CustomerQuery) =>
  request<PaginatedCustomers>(`/api/v1/people?${toSearchParams(query)}`, {
    method: "GET",
    accessToken,
  });

export const createCustomer = (accessToken: string, payload: CustomerMutationInput) =>
  request<Customer>("/api/v1/people", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });

export const updateCustomer = (accessToken: string, id: string, payload: Partial<CustomerMutationInput>) =>
  request<Customer>(`/api/v1/people/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });

export const deleteCustomer = (accessToken: string, id: string) =>
  request<void>(`/api/v1/people/${id}`, {
    method: "DELETE",
    accessToken,
  });
