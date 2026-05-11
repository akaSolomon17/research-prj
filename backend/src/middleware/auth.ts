import type { NextFunction, Request, Response } from "express";

import { createSupabaseAdminClient } from "../lib/supabase.js";
import { sendUnauthorized } from "../utils/http.js";

const parseBearerToken = (headerValue?: string): string | null => {
  if (!headerValue) {
    return null;
  }
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = parseBearerToken(req.header("Authorization"));
  if (!accessToken) {
    return sendUnauthorized(res, "Missing access token");
  }

  const adminClient = createSupabaseAdminClient();
  const userResult = await adminClient.auth.getUser(accessToken);
  if (userResult.error || !userResult.data.user) {
    return sendUnauthorized(res, "Invalid access token");
  }

  const role = userResult.data.user.app_metadata?.role === "admin" ? "admin" : "user";

  req.auth = {
    userId: userResult.data.user.id,
    email: userResult.data.user.email ?? null,
    role,
    accessToken,
  };
  return next();
};
