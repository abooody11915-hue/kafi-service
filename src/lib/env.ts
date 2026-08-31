import { z } from "zod";

const optionalUrl = z.string().url().optional();

export const env = z
  .object({
    VITE_SUPABASE_URL: optionalUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  })
  .parse(import.meta.env);

export const isBackendConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
