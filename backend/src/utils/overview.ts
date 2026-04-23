import type { OrderStatus } from "../types/database.js";

export interface OverviewInput {
  amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface OverviewResult {
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: Array<{ status: OrderStatus; count: number }>;
  dailySeries: Array<{ day: string; count: number }>;
}

const baseStatusMap: Record<OrderStatus, number> = {
  pending: 0,
  completed: 0,
  cancelled: 0,
};

export const computeOverview = (rows: OverviewInput[]): OverviewResult => {
  const statusMap = { ...baseStatusMap };
  const dailyMap = new Map<string, number>();
  let totalRevenue = 0;

  rows.forEach((row) => {
    statusMap[row.status] += 1;
    totalRevenue += row.amount;
    const day = row.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  });

  const statusBreakdown: Array<{ status: OrderStatus; count: number }> = [
    { status: "pending", count: statusMap.pending },
    { status: "completed", count: statusMap.completed },
    { status: "cancelled", count: statusMap.cancelled },
  ];

  const dailySeries = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  return {
    totalOrders: rows.length,
    totalRevenue,
    statusBreakdown,
    dailySeries,
  };
};
