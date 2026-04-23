import { createClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";

const baseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const createSupabaseAdminClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, baseOptions);

export const createSupabaseUserClient = (accessToken: string) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...baseOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
