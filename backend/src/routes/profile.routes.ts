import { Router } from "express";
import { z } from "zod";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { sendBadRequest, sendServerError, sendUnauthorized } from "../utils/http.js";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(80).optional(),
    zip: z.string().trim().max(20).optional(),
    source: z.string().trim().max(80).optional(),
    birthDate: z.string().trim().optional(),
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
      .from("people")
      .select("id,address,email,name,city,state,source,birth_date,zip,created_at")
      .eq("id", req.auth.userId)
      .single(),
    supabase
      .from("orders")
      .select("total,quantity")
      .eq("user_id", req.auth.userId),
  ]);

  if (profileResult.error) {
    return sendServerError(res, profileResult.error.message);
  }
  if (ordersResult.error) {
    return sendServerError(res, ordersResult.error.message);
  }

  const orderSummary = {
    total: ordersResult.data?.length ?? 0,
    totalSpent: 0,
    totalQuantity: 0,
    averageOrderValue: 0,
  };

  (ordersResult.data ?? []).forEach((order: { total: number; quantity: number }) => {
    orderSummary.totalSpent += Number(order.total);
    orderSummary.totalQuantity += Number(order.quantity);
  });

  orderSummary.averageOrderValue =
    orderSummary.total > 0 ? Number((orderSummary.totalSpent / orderSummary.total).toFixed(2)) : 0;

  return res.json({
    profile: {
      ...profileResult.data,
      role: req.auth.role,
    },
    orderSummary,
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
    .from("people")
    .update({
      name: payload.name,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      source: payload.source,
      birth_date: payload.birthDate ?? null,
    })
    .eq("id", req.auth.userId)
    .select("id,address,email,name,city,state,source,birth_date,zip,created_at")
    .single();

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.json({
    ...result.data,
    role: req.auth.role,
  });
});
