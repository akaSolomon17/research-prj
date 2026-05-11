import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { sendBadRequest, sendForbidden, sendNotFound, sendServerError, sendUnauthorized } from "../utils/http.js";

const listPeopleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
});

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  source: z.string().trim().max(80).optional().nullable(),
  birthDate: z.string().trim().optional().nullable(),
  password: z.string().trim().optional().nullable(),
});

const parseRequest = <T>(schema: z.ZodType<T>, payload: unknown): T | null => {
  const parsed = schema.safeParse(payload);
  return parsed.success ? parsed.data : null;
};

const requireAdmin = (req: Request, res: Response) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }
  if (req.auth.role !== "admin") {
    return sendForbidden(res);
  }
  return null;
};

export const peopleRouter = Router();

peopleRouter.get("/", async (req, res) => {
  const blocked = requireAdmin(req, res);
  if (blocked) {
    return blocked;
  }

  const query = parseRequest(listPeopleQuerySchema, req.query);
  if (!query) {
    return sendBadRequest(res, "Invalid query params");
  }

  const supabase = createSupabaseUserClient(req.auth!.accessToken);
  const result = await supabase
    .from("people")
    .select("id,address,email,password,name,city,state,source,birth_date,zip,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  const search = query.search?.toLowerCase();
  const filtered = search
    ? (result.data ?? []).filter((person) =>
        [person.name, person.email, person.city, person.state, person.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
      )
    : result.data ?? [];

  const total = filtered.length;
  const offset = (query.page - 1) * query.limit;

  return res.json({
    items: filtered.slice(offset, offset + query.limit),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
});

peopleRouter.post("/", async (req, res) => {
  const blocked = requireAdmin(req, res);
  if (blocked) {
    return blocked;
  }

  const payload = parseRequest(customerSchema, req.body);
  if (!payload) {
    return sendBadRequest(res, "Invalid payload");
  }

  const supabase = createSupabaseUserClient(req.auth!.accessToken);
  const result = await supabase
    .from("people")
    .insert({
      address: payload.address ?? null,
      email: payload.email,
      password: payload.password ?? null,
      name: payload.name,
      city: payload.city ?? null,
      state: payload.state ?? null,
      source: payload.source ?? null,
      birth_date: payload.birthDate ?? null,
      zip: payload.zip ?? null,
    })
    .select("id,address,email,password,name,city,state,source,birth_date,zip,created_at")
    .single();

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.status(201).json(result.data);
});

peopleRouter.patch("/:id", async (req, res) => {
  const blocked = requireAdmin(req, res);
  if (blocked) {
    return blocked;
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return sendBadRequest(res, "Invalid customer id");
  }

  const payload = parseRequest(customerSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" }), req.body);
  if (!payload) {
    return sendBadRequest(res, "Invalid payload");
  }

  const supabase = createSupabaseUserClient(req.auth!.accessToken);
  const result = await supabase
    .from("people")
    .update({
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.city !== undefined ? { city: payload.city } : {}),
      ...(payload.state !== undefined ? { state: payload.state } : {}),
      ...(payload.zip !== undefined ? { zip: payload.zip } : {}),
      ...(payload.source !== undefined ? { source: payload.source } : {}),
      ...(payload.birthDate !== undefined ? { birth_date: payload.birthDate } : {}),
      ...(payload.password !== undefined ? { password: payload.password } : {}),
    })
    .eq("id", id.data)
    .select("id,address,email,password,name,city,state,source,birth_date,zip,created_at")
    .single();

  if (result.error) {
    if (result.error.code === "PGRST116") {
      return sendNotFound(res, "Customer not found");
    }
    return sendServerError(res, result.error.message);
  }

  return res.json(result.data);
});

peopleRouter.delete("/:id", async (req, res) => {
  const blocked = requireAdmin(req, res);
  if (blocked) {
    return blocked;
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return sendBadRequest(res, "Invalid customer id");
  }

  const supabase = createSupabaseUserClient(req.auth!.accessToken);
  const result = await supabase.from("people").delete().eq("id", id.data);
  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.status(204).send();
});
