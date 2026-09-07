import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function normalizeSaudiPhone(value: unknown): { local: string; e164: string } | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  let local: string;
  if (/^05\d{8}$/.test(digits)) local = digits;
  else if (/^5\d{8}$/.test(digits)) local = `0${digits}`;
  else if (/^9665\d{8}$/.test(digits)) local = `0${digits.slice(3)}`;
  else return null;
  return { local, e164: `+966${local.slice(1)}` };
}

async function callAuthentica(endpoint: "send-otp" | "verify-otp", body: Record<string, string>) {
  const apiKey = Deno.env.get("AUTHENTICA_API_KEY");
  if (!apiKey) throw new Error("OTP_NOT_CONFIGURED");
  const response = await fetch(`https://api.authentica.sa/api/v2/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Authorization": apiKey },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    console.warn("[AuthenticaPhoneOtp] Provider rejected request", { endpoint, status: response.status });
    throw new Error(`AUTHENTICA_${response.status}`);
  }
  return payload;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => null) as { action?: unknown; phone?: unknown; code?: unknown } | null;
    const action = body?.action === "send" || body?.action === "verify" ? body.action : null;
    const phone = normalizeSaudiPhone(body?.phone);
    if (!action || !phone) return json({ error: "invalid_request" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "service_unavailable" }, 503);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: profile, error: profileError } = await admin.from("profiles").select("id").eq("phone", phone.local).maybeSingle();
    if (profileError) return json({ error: "service_unavailable" }, 503);

    if (action === "send") {
      // Keep the response identical for unknown numbers to reduce account enumeration.
      if (!profile?.id) return json({ ok: true });
      const result = await callAuthentica("send-otp", { method: "sms", phone: phone.e164 });
      if (result.success === false || result.status === false) return json({ error: "otp_unavailable" }, 400);
      return json({ ok: true });
    }

    const code = String(body?.code ?? "").replace(/\D/g, "");
    if (code.length !== 6 || !profile?.id) return json({ error: "invalid_code" }, 400);
    const result = await callAuthentica("verify-otp", { phone: phone.e164, otp: code });
    if (result.status !== true) return json({ error: "invalid_code" }, 400);

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const email = userResult?.user?.email;
    if (userError || !email) return json({ error: "service_unavailable" }, 503);
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const properties = linkData?.properties as { hashed_token?: string; hashedToken?: string } | undefined;
    const tokenHash = properties?.hashed_token ?? properties?.hashedToken;
    if (linkError || !tokenHash) return json({ error: "service_unavailable" }, 503);
    return json({ ok: true, token_hash: tokenHash });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "OTP_NOT_CONFIGURED") return json({ error: "otp_not_configured" }, 503);
    console.warn("[AuthenticaPhoneOtp] Request failed", message);
    return json({ error: "otp_unavailable" }, 400);
  }
});
