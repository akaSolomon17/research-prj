import { describe, expect, it } from "vitest";

import { formatMoney } from "@/features/Orders/utils";

describe("orders utils", () => {
  it("formats currency", () => {
    expect(formatMoney(199.5)).toBe("$199.50");
  });
});
