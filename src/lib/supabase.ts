import { createClient } from "@supabase/supabase-js";
import { env, isBackendConfigured } from "./env";

export const supabase = isBackendConfigured
  ? createClient(
      env.VITE_SUPABASE_URL!,
      env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  : null;
