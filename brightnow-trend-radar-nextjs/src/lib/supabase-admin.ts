import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);
