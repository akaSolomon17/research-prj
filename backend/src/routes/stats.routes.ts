import { Router } from "express";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { computeOverview } from "../utils/overview.js";
import { sendServerError, sendUnauthorized } from "../utils/http.js";

export const statsRouter = Router();

statsRouter.get("/overview", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  let query = supabase
    .from("orders")
    .select("status,amount,created_at")
    .order("created_at", { ascending: true });

  if (req.auth.role !== "admin") {
    query = query.eq("user_id", req.auth.userId);
  }

  const result = await query;
  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  const overview = computeOverview(result.data ?? []);
  return res.json(overview);
});
