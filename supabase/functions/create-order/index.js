import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Supabase dashboard prevents env names that start with `SUPABASE_`.
// Read non-prefixed names and fall back to prefixed names when present.
const PROJECT_URL = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Server-side canonical size mapping and delivery charge
const SIZES = [
  { label: "10g", price: 140 },
  { label: "25g", price: 350 },
  { label: "50g", price: 700 },
  { label: "100g", price: 1400 },
];
const DELIVERY_CHARGE = 100;

const fetchProductFromDb = async (id) => {
  const url = `${PROJECT_URL}/rest/v1/products?id=eq.${id}&select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] ?? null;
};

// Try to fetch a variant price from product_variants table if available
const fetchVariantPrice = async (productId, sizeLabel) => {
  try {
    const url = `${PROJECT_URL}/rest/v1/product_variants?product_id=eq.${productId}&size=eq.${encodeURIComponent(sizeLabel)}&select=price`;
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return Number(data[0].price);
    return null;
  } catch (e) {
    console.error("fetchVariantPrice error:", e);
    return null;
  }
};

const insertOrderToDb = async (orderPayload) => {
  const url = `${PROJECT_URL}/rest/v1/orders`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([orderPayload]),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert order failed: ${res.status} ${text}`);
  }
  const resp = await res.json();
  return resp[0];
};

const callSendOrderEmail = async (order) => {
  try {
    const url = `${PROJECT_URL}/functions/v1/send-order-email`;
    await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });
  } catch (e) {
    console.error("Failed to call send-order-email:", e);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Expect minimal client data only:
    // { customer_name, phone, email, address, pincode, items: [{ id, size, quantity }], payment_method, user_id, freeDeliveryFor50Plus }

    let {
      customer_name,
      phone,
      email,
      address,
      pincode,
      items: clientItems,
      payment_method = "cod",
      user_id = null,
      freeDeliveryFor50Plus = false,
    } = body;

    // If the client provided an Authorization bearer token, verify it by calling Supabase Auth
    // `/auth/v1/user` endpoint to get the canonical user id.
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const authRes = await fetch(`${PROJECT_URL}/auth/v1/user`, {
          headers: {
            Authorization: authHeader,
            apikey: SERVICE_ROLE_KEY,
          },
        });

        if (authRes.ok) {
          const authJson = await authRes.json();
          if (authJson && authJson.id) {
            user_id = authJson.id;
          }
        } else {
          const txt = await authRes.text().catch(() => "");
          console.warn("Could not verify user token via auth/v1/user:", authRes.status, txt);
        }
      }
    } catch (e) {
      console.error("Error verifying auth token:", e);
    }

    if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build canonical items: look up product for name and ensure price comes from server-side mapping
    const processedItems = [];
    let subtotal = 0;
    for (const ci of clientItems) {
      const product = await fetchProductFromDb(ci.id);
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${ci.id}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const sizeLabel = (ci.size || "").toString();
      let price = null;
      // Try variant price first
      price = await fetchVariantPrice(product.id, sizeLabel);
      if (price === null) {
        // fallback to SIZES mapping
        const sizeObj = SIZES.find((s) => s.label === sizeLabel) || SIZES[0];
        price = sizeObj.price;
      }
      const quantity = Number(ci.quantity || 1);

      processedItems.push({
        id: product.id,
        // Include both `name` and `product_name` to be compatible with different consumers
        name: product.name,
        product_name: product.name,
        size: sizeLabel,
        price,
        quantity,
      });

      subtotal += price * quantity;
    }

    // Compute shipping total (flat per-order): free if any item size >= 50g and flag enabled
    const anyEligibleForFree = processedItems.some((it) => {
      const sizeNum = parseInt((it.size || "").replace(/[^0-9]/g, "") || "0", 10);
      return sizeNum >= 50;
    });

    const shippingTotal = (freeDeliveryFor50Plus && anyEligibleForFree) ? 0 : DELIVERY_CHARGE;

    const total_price = subtotal + shippingTotal;

    // Insert order using service role key
    const orderPayload = {
      customer_name,
      phone,
      email,
      address,
      pincode,
      items: processedItems,
      total_price,
      payment_method,
      status: "pending",
      user_id,
    };

    const inserted = await insertOrderToDb(orderPayload);

    // Fire off email (best-effort)
    callSendOrderEmail({
      orderId: inserted.id,
      customerName: customer_name,
      customerEmail: email,
      phone,
      address,
      pincode,
      items: processedItems,
      totalPrice: total_price,
      paymentMethod: payment_method,
      adminEmail: ADMIN_EMAIL,
    });

    return new Response(JSON.stringify({ success: true, order: inserted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in create-order function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});