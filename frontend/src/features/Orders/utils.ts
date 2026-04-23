import type { OrderStatus } from "@/shared/types/models";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "completed", "cancelled"];

export const toReadableStatus = (status: OrderStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

export const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};
