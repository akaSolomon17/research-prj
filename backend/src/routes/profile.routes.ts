import { Router } from "express";
import { z } from "zod";

import { createSupabaseUserClient } from "../lib/supabase.js";
import type { OrderStatus } from "../types/database.js";
import { sendBadRequest, sendServerError, sendUnauthorized } from "../utils/http.js";

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(20).optional(),
    avatarUrl: z.string().trim().url().or(z.literal("")).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

export const profileRouter = Router();

profileRouter.get("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const [profileResult, ordersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,phone,avatar_url,role,created_at,updated_at")
      .eq("id", req.auth.userId)
      .single(),
    supabase
      .from("orders")
      .select("status")
      .eq("user_id", req.auth.userId),
  ]);

  if (profileResult.error) {
    return sendServerError(res, profileResult.error.message);
  }
  if (ordersResult.error) {
    return sendServerError(res, ordersResult.error.message);
  }

  const summary = {
    total: ordersResult.data?.length ?? 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  (ordersResult.data ?? []).forEach((order: { status: OrderStatus }) => {
    summary[order.status] += 1;
  });

  return res.json({
    profile: profileResult.data,
    orderSummary: summary,
  });
});

profileRouter.patch("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendBadRequest(res, "Invalid payload");
  }

  const payload = parsed.data;
  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const result = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName,
      phone: payload.phone,
      avatar_url: payload.avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.auth.userId)
    .select("id,full_name,phone,avatar_url,role,created_at,updated_at")
    .single();

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.json(result.data);
});
