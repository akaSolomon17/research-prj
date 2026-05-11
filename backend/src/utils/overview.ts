export interface OverviewInput {
  total: number;
  quantity: number;
  created_at: string;
}

export interface OverviewResult {
  totalOrders: number;
  totalRevenue: number;
  totalQuantity: number;
  averageOrderValue: number;
  dailySeries: Array<{ day: string; count: number }>;
}

export const computeOverview = (rows: OverviewInput[]): OverviewResult => {
  const dailyMap = new Map<string, number>();
  let totalRevenue = 0;
  let totalQuantity = 0;

  rows.forEach((row) => {
    totalRevenue += Number(row.total);
    totalQuantity += Number(row.quantity);
    const day = row.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  });

  const dailySeries = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  return {
    totalOrders: rows.length,
    totalRevenue,
    totalQuantity,
    averageOrderValue: rows.length > 0 ? Number((totalRevenue / rows.length).toFixed(2)) : 0,
    dailySeries,
  };
};
