import { describe, expect, it } from "vitest";

import { computeOverview } from "./overview.js";

describe("computeOverview", () => {
  it("aggregates totals and daily trend", () => {
    const result = computeOverview([
      { total: 120, quantity: 2, created_at: "2026-04-20T10:00:00.000Z" },
      { total: 350, quantity: 1, created_at: "2026-04-20T12:00:00.000Z" },
      { total: 90, quantity: 3, created_at: "2026-04-21T09:00:00.000Z" },
    ]);

    expect(result.totalOrders).toBe(3);
    expect(result.totalRevenue).toBe(560);
    expect(result.totalQuantity).toBe(6);
    expect(result.averageOrderValue).toBe(186.67);
    expect(result.dailySeries).toEqual([
      { day: "2026-04-20", count: 2 },
      { day: "2026-04-21", count: 1 },
    ]);
  });
});
