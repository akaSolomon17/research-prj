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
  totalQuantity: 0,
  averageOrderValue: 0,
  dailySeries: [],
};

export const HomeDashboardPage = () => {
  const { session, profile } = useAuth();
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
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-950 px-6 py-6 text-white md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <span className="chip border-white/10 bg-white/10 text-white/80">Live overview</span>
          <h1 className="font-heading text-3xl font-bold text-white">Home Dashboard</h1>
          <p className="text-sm leading-6 text-slate-300">
            Overview of your order volume, revenue, quantity, and daily trend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip border-white/10 bg-white/10 text-white/80">{profile?.role ?? "user"} account</span>
          {profile?.name ? <span className="chip border-white/10 bg-white/10 text-white/80">{profile.name}</span> : null}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total orders</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{overview.totalOrders}</p>
          <p className="mt-2 text-sm text-slate-500">Completed rows in the current dataset.</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total revenue</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">
            ${overview.totalRevenue.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-500">Sum of order totals across the visible scope.</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total quantity</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{overview.totalQuantity}</p>
          <p className="mt-2 text-sm text-slate-500">Items sold in the current order set.</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average order</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">
            ${overview.averageOrderValue.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-500">Average value per order transaction.</p>
        </div>
      </div>

      <div className="panel-strong p-5 md:p-6" data-atid="dashboard-chart">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-900">Daily order chart</h2>
            <p className="mt-1 text-sm text-slate-500">Daily count trend for the current dataset.</p>
          </div>
          <span className="chip">{overview.dailySeries.length} days</span>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading chart...</p> : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        ) : null}
        {!loading && !error ? (
          <div className="mt-6 h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={overview.dailySeries}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </section>
  );
};
