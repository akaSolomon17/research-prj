import { Router } from "express";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { sendServerError, sendUnauthorized } from "../utils/http.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  if (!req.auth) {
    return sendUnauthorized(res);
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const result = await supabase
    .from("products")
    .select("id,ean,title,category,vendor,price,rating,created_at")
    .order("created_at", { ascending: false });

  if (result.error) {
    return sendServerError(res, result.error.message);
  }

  return res.json(result.data ?? []);
});
