import { request } from "@/shared/api/http";
import type { DashboardOverview } from "@/shared/types/models";

export const getDashboardOverview = (accessToken: string) =>
  request<DashboardOverview>("/api/v1/stats/overview", {
    method: "GET",
    accessToken,
  });
