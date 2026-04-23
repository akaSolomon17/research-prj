import { Router } from "express";
import { z } from "zod";

import { createSupabaseUserClient } from "../lib/supabase.js";
import type { OrderStatus } from "../types/database.js";
import {
  sendBadRequest,
  sendNotFound,
  sendServerError,
  sendUnauthorized,
} from "../utils/http.js";

const orderStatus = z.enum(["pending", "completed", "cancelled"]);

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  status: orderStatus.optional(),
});

const createOrderSchema = z.object({
  title: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive(),
  status: orderStatus.default("pending"),
  userId: z.string().uuid().optional(),
});

const updateOrderSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    amount: z.coerce.number().positive().optional(),
    status: orderStatus.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

const buildOrderCode = () => `ORD-${Date.now().toString().slice(-8)}`;

const applyScope = <T>(query: T, role: string, userId: string) => {
  if (role === "admin") {
    return query;
  }
  return (query as { eq: (key: string, value: string) => T }).eq("user_id", userId);
};

const parseRequest = <T>(schema: z.ZodType<T>, payload: unknown): T | null => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

export const ordersRouter = Router();

ordersRouter.get("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const query = parseRequest(listOrdersQuerySchema, req.query);
  if (!query) {
    return sendBadRequest(res, "Invalid query params");
  }

  const offset = (query.page - 1) * query.limit;
  const supabase = createSupabaseUserClient(req.auth.accessToken);
  let dataQuery = applyScope(
    supabase
      .from("orders")
      .select("id,user_id,code,title,amount,status,created_at,updated_at", { count: "exact" })
      .order("created_at", { ascending: false }),
    req.auth.role,
    req.auth.userId,
  );

  if (query.search) {
    dataQuery = dataQuery.or(`code.ilike.%${query.search}%,title.ilike.%${query.search}%`);
  }
  if (query.status) {
    dataQuery = dataQuery.eq("status", query.status);
  }

  const result = await dataQuery.range(offset, offset + query.limit - 1);
  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.json({
    items: result.data ?? [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.count ?? 0,
      totalPages: Math.max(1, Math.ceil((result.count ?? 0) / query.limit)),
    },
  });
});

ordersRouter.post("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const payload = parseRequest(createOrderSchema, req.body);
  if (!payload) {
    return sendBadRequest(res, "Invalid payload");
  }

  const userId = req.auth.role === "admin" && payload.userId ? payload.userId : req.auth.userId;
  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const result = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      code: buildOrderCode(),
      title: payload.title,
      amount: payload.amount,
      status: payload.status,
    })
    .select("id,user_id,code,title,amount,status,created_at,updated_at")
    .single();

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.status(201).json(result.data);
});

ordersRouter.patch("/:id", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return sendBadRequest(res, "Invalid order id");
  }

  const payload = parseRequest(updateOrderSchema, req.body);
  if (!payload) {
    return sendBadRequest(res, "Invalid payload");
  }

  const updatePayload: {
    title?: string;
    amount?: number;
    status?: OrderStatus;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (payload.title !== undefined) {
    updatePayload.title = payload.title;
  }
  if (payload.amount !== undefined) {
    updatePayload.amount = payload.amount;
  }
  if (payload.status !== undefined) {
    updatePayload.status = payload.status;
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  let updateQuery = supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id.data);

  if (req.auth.role !== "admin") {
    updateQuery = updateQuery.eq("user_id", req.auth.userId);
  }

  const result = await updateQuery
    .select("id,user_id,code,title,amount,status,created_at,updated_at")
    .single();
  if (result.error) {
    if (result.error.code === "PGRST116") {
      return sendNotFound(res, "Order not found");
    }
    return sendServerError(res, result.error.message);
  }

  return res.json(result.data);
});

ordersRouter.delete("/:id", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return sendBadRequest(res, "Invalid order id");
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  let deleteQuery = supabase.from("orders").delete().eq("id", id.data);
  if (req.auth.role !== "admin") {
    deleteQuery = deleteQuery.eq("user_id", req.auth.userId);
  }

  const result = await deleteQuery;
  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.status(204).send();
});
