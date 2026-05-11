import { Router } from "express";

import { createSupabaseUserClient } from "../lib/supabase.js";
import { sendServerError } from "../utils/http.js";

export const authRouter = Router();

authRouter.get("/me", async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabase = createSupabaseUserClient(req.auth.accessToken);
  const profileResult = await supabase
    .from("people")
    .select("id,address,email,name,city,state,source,birth_date,zip,created_at")
    .eq("id", req.auth.userId)
    .single();

  if (profileResult.error) {
    return sendServerError(res, profileResult.error.message);
  }

  const role = req.auth.role;

  return res.json({
    user: {
      id: req.auth.userId,
      email: req.auth.email,
      role,
    },
    profile: {
      ...profileResult.data,
      role,
    },
  });
});
