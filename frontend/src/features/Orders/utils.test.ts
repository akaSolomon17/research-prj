import { describe, expect, it } from "vitest";

import { formatMoney, getStatusColor, toReadableStatus } from "@/features/Orders/utils";

describe("orders utils", () => {
  it("formats currency", () => {
    expect(formatMoney(199.5)).toBe("$199.50");
  });

  it("maps status text", () => {
    expect(toReadableStatus("pending")).toBe("Pending");
  });

  it("returns completed status color classes", () => {
    expect(getStatusColor("completed")).toContain("emerald");
  });
});
