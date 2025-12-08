import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const PROJECT_URL = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, pincode, start = 0, limit = 5 } = body || {};

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedStart = Number.isFinite(+start) ? Math.max(0, Number(start)) : 0;
    const sanitizedLimit = Number.isFinite(+limit) ? Math.max(1, Number(limit)) : 5;

    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("order", "created_at.desc");
    params.set("email", `eq.${encodeURIComponent(email.trim())}`);
    if (pincode) {
      params.set("pincode", `eq.${encodeURIComponent(pincode.trim())}`);
    }

    const url = `${PROJECT_URL}/rest/v1/orders?${params.toString()}`;
    const rangeHeader = `${sanitizedStart}-${sanitizedStart + sanitizedLimit - 1}`;

    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Range: rangeHeader,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch orders: ${res.status} ${text}`);
    }

    const orders = await res.json();

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in find-orders function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
