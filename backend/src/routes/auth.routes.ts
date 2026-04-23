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
    .from("profiles")
    .select("id,full_name,phone,avatar_url,role,created_at,updated_at")
    .eq("id", req.auth.userId)
    .single();

  if (profileResult.error) {
    return sendServerError(res, profileResult.error.message);
  }

  return res.json({
    user: {
      id: req.auth.userId,
      email: req.auth.email,
    },
    profile: profileResult.data,
  });
});
