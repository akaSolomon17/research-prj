import { describe, expect, it } from "vitest";

import { computeOverview } from "./overview.js";

describe("computeOverview", () => {
  it("aggregates status, totals and daily trend", () => {
    const result = computeOverview([
      { amount: 120, status: "pending", created_at: "2026-04-20T10:00:00.000Z" },
      { amount: 350, status: "completed", created_at: "2026-04-20T12:00:00.000Z" },
      { amount: 90, status: "completed", created_at: "2026-04-21T09:00:00.000Z" },
    ]);

    expect(result.totalOrders).toBe(3);
    expect(result.totalRevenue).toBe(560);
    expect(result.statusBreakdown).toEqual([
      { status: "pending", count: 1 },
      { status: "completed", count: 2 },
      { status: "cancelled", count: 0 },
    ]);
    expect(result.dailySeries).toEqual([
      { day: "2026-04-20", count: 2 },
      { day: "2026-04-21", count: 1 },
    ]);
  });
});
