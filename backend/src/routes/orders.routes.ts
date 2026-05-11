import { Router } from "express";
import { z } from "zod";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { sendBadRequest, sendNotFound, sendServerError, sendUnauthorized } from "../utils/http.js";

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
});

const createOrderSchema = z.object({
  userId: z.string().uuid().optional(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
  discount: z.coerce.number().min(0).default(0),
});

const updateOrderSchema = z
  .object({
    userId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).optional(),
    discount: z.coerce.number().min(0).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

type OrderRow = {
  id: string;
  user_id: string;
  product_id: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  quantity: number;
  created_at: string;
  product:
    | Array<{
        id: string;
        ean: string;
        title: string;
        category: string | null;
        vendor: string | null;
        price: number;
        rating: number;
      }>
    | {
        id: string;
        ean: string;
        title: string;
        category: string | null;
        vendor: string | null;
        price: number;
        rating: number;
      }
    | null;
  person:
    | Array<{
        id: string;
        name: string | null;
        email: string | null;
      }>
    | {
        id: string;
        name: string | null;
        email: string | null;
      }
    | null;
};

const parseRequest = <T>(schema: z.ZodType<T>, payload: unknown): T | null => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

const applyScope = (rows: OrderRow[], role: string, userId: string) =>
  role === "admin" ? rows : rows.filter((row) => row.user_id === userId);

const firstRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const toPayload = (row: OrderRow) => ({
  id: row.id,
  user_id: row.user_id,
  product_id: row.product_id,
  subtotal: row.subtotal,
  tax: row.tax,
  total: row.total,
  amount: row.total,
  discount: row.discount,
  quantity: row.quantity,
  title: firstRelation(row.product)?.title ?? "Order item",
  product: firstRelation(row.product),
  person: firstRelation(row.person),
  created_at: row.created_at,
});

export const ordersRouter = Router();

ordersRouter.get("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const query = parseRequest(listOrdersQuerySchema, req.query);
  if (!query) {
    return sendBadRequest(res, "Invalid query params");
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const result = await supabase
    .from("orders")
    .select(
      `
        id,
        user_id,
        product_id,
        subtotal,
        tax,
        total,
        discount,
        quantity,
        created_at,
        product:products (
          id,
          ean,
          title,
          category,
          vendor,
          price,
          rating
        ),
        person:people (
          id,
          name,
          email
        )
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  const scopedRows = applyScope((result.data as unknown as OrderRow[] | null) ?? [], req.auth.role, req.auth.userId);
  const search = query.search?.toLowerCase();
  const filteredRows = search
    ? scopedRows.filter((row) => {
        const title = firstRelation(row.product)?.title?.toLowerCase() ?? "";
        const ean = firstRelation(row.product)?.ean?.toLowerCase() ?? "";
        const name = firstRelation(row.person)?.name?.toLowerCase() ?? "";
        const email = firstRelation(row.person)?.email?.toLowerCase() ?? "";
        return [title, ean, name, email].some((value) => value.includes(search));
      })
    : scopedRows;

  const total = filteredRows.length;
  const offset = (query.page - 1) * query.limit;
  const items = filteredRows.slice(offset, offset + query.limit).map(toPayload);

  return res.json({
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
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

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const result = await supabase
    .from("orders")
    .insert({
      user_id: req.auth.role === "admin" && payload.userId ? payload.userId : req.auth.userId,
      product_id: payload.productId,
      quantity: payload.quantity,
      discount: payload.discount,
    })
    .select(
      `
        id,
        user_id,
        product_id,
        subtotal,
        tax,
        total,
        discount,
        quantity,
        created_at,
        product:products (
          id,
          ean,
          title,
          category,
          vendor,
          price,
          rating
        ),
        person:people (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.status(201).json(toPayload(result.data as unknown as OrderRow));
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

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  let updateQuery = supabase.from("orders").update({
    ...(payload.userId ? { user_id: payload.userId } : {}),
    ...(payload.productId ? { product_id: payload.productId } : {}),
    ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
    ...(payload.discount !== undefined ? { discount: payload.discount } : {}),
  });

  updateQuery = updateQuery.eq("id", id.data);
  if (req.auth.role !== "admin") {
    updateQuery = updateQuery.eq("user_id", req.auth.userId);
  }

  const result = await updateQuery
    .select(
      `
        id,
        user_id,
        product_id,
        subtotal,
        tax,
        total,
        discount,
        quantity,
        created_at,
        product:products (
          id,
          ean,
          title,
          category,
          vendor,
          price,
          rating
        ),
        person:people (
          id,
          name,
          email
        )
      `,
    )
    .single();

  if (result.error) {
    if (result.error.code === "PGRST116") {
      return sendNotFound(res, "Order not found");
    }
    return sendServerError(res, result.error.message);
  }

  return res.json(toPayload(result.data as unknown as OrderRow));
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
