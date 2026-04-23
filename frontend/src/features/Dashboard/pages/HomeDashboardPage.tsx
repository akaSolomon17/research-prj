import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboardOverview } from "@/features/Dashboard/api";
import { useAuth } from "@/features/Auth/auth-context";
import type { DashboardOverview } from "@/shared/types/models";

const defaultOverview: DashboardOverview = {
  totalOrders: 0,
  totalRevenue: 0,
  statusBreakdown: [
    { status: "pending", count: 0 },
    { status: "completed", count: 0 },
    { status: "cancelled", count: 0 },
  ],
  dailySeries: [],
};

export const HomeDashboardPage = () => {
  const { session } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>(defaultOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    setLoading(true);
    void getDashboardOverview(session.accessToken)
      .then((payload) => {
        setOverview(payload);
        setError(null);
      })
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : "Failed to load overview";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Home Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Overview of your order performance and current status distribution.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total orders</p>
          <p className="mt-2 font-heading text-2xl font-bold text-slate-900">{overview.totalOrders}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total revenue</p>
          <p className="mt-2 font-heading text-2xl font-bold text-slate-900">
            ${overview.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</p>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-600">
            {overview.statusBreakdown.find((item) => item.status === "completed")?.count ?? 0}
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
          <p className="mt-2 font-heading text-2xl font-bold text-amber-600">
            {overview.statusBreakdown.find((item) => item.status === "pending")?.count ?? 0}
          </p>
        </div>
      </div>

      <div className="panel p-5" data-atid="dashboard-chart">
        <h2 className="font-heading text-xl font-semibold text-slate-900">Order status breakdown</h2>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading chart...</p> : null}
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}
        {!loading && !error ? (
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer>
              <BarChart data={overview.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </section>
  );
};
