import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const PROMO_CODE = Deno.env.get("PROMO_CODE") || "FREEDELIVERY";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const code = (body?.code || "").toString().trim().toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ valid: false, message: "Code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValid = code === PROMO_CODE.toUpperCase();
    return new Response(
      JSON.stringify({ valid: isValid, message: isValid ? "Promo valid" : "Promo invalid" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error validating promo code:", error);
    return new Response(JSON.stringify({ valid: false, error: error.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
