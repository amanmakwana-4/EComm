import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Royal Pure Spices <onboarding@resend.dev>";

if (!RESEND_API_KEY) {
  console.error("⚠️  RESEND_API_KEY not configured! Emails will not be sent.");
  console.error("Please set RESEND_API_KEY in Supabase Edge Functions environment variables.");
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const generateOrderItemsHtml = (items) => {
  return (items || [])
    .map((item) => {
      const name = item?.name || item?.product_name || 'Item';
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      const lineTotal = price * quantity;

      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${lineTotal.toFixed(2)}</td>
    </tr>
  `;
    })
    .join("");
};

const generateCustomerEmailHtml = (order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - Royal Pure Spices</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #B8860B, #DAA520); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 28px;">Royal Pure Spices</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Order Confirmation</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">
    <h2 style="color: #B8860B; margin-top: 0;">Thank you for your order, ${order.customerName}!</h2>
    
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin: 10px 0 0;"><strong>Payment Method:</strong> ${
        order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"
      }</p>
    </div>
    
    <h3 style="color: #333; border-bottom: 2px solid #B8860B; padding-bottom: 10px;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: center;">Qty</th>
          <th style="padding: 12px; text-align: right;">Price</th>
          <th style="padding: 12px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${generateOrderItemsHtml(order.items)}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
          <td style="padding: 12px; text-align: right;">₹${order.totalPrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Delivery:</td>
          <td style="padding: 12px; text-align: right; color: #B8860B;">FREE</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #B8860B;">₹${
            order.totalPrice.toFixed(2)
          }</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color: #333; border-bottom: 2px solid #B8860B; padding-bottom: 10px;">Delivery Address</h3>
    <p style="margin: 15px 0;">
      ${order.customerName}<br>
      ${order.address}<br>
      Pincode: ${order.pincode}<br>
      Phone: ${order.phone}
    </p>
    
    <div style="background: #fffbeb; border: 1px solid #B8860B; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>Track your order:</strong> You can view your order status anytime by logging into your account.
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      If you have any questions about your order, please contact us at support@royalpurespices.com
    </p>
  </div>
  
  <div style="background: #333; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="color: #fff; margin: 0; font-size: 14px;">© 2024 Royal Pure Spices. All rights reserved.</p>
  </div>
</body>
</html>
`;

const generateAdminEmailHtml = (order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Alert - Royal Pure Spices</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 28px;">🔔 New Order Received!</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">
    <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="margin: 10px 0 0;"><strong>Total Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
      <p style="margin: 10px 0 0;"><strong>Payment:</strong> ${
        order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"
      }</p>
    </div>
    
    <h3 style="color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Customer Details</h3>
    <table style="width: 100%; margin: 15px 0;">
      <tr>
        <td style="padding: 8px 0;"><strong>Name:</strong></td>
        <td>${order.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Email:</strong></td>
        <td>${order.customerEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Phone:</strong></td>
        <td>${order.phone}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Address:</strong></td>
        <td>${order.address}, ${order.pincode}</td>
      </tr>
    </table>
    
    <h3 style="color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Order Items</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: center;">Qty</th>
          <th style="padding: 12px; text-align: right;">Price</th>
          <th style="padding: 12px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${generateOrderItemsHtml(order.items)}
      </tbody>
    </table>
    
    <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; color: #166534;">
        <strong>Action Required:</strong> Please process this order and update the status in the admin dashboard.
      </p>
    </div>
  </div>
  
  <div style="background: #333; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="color: #fff; margin: 0; font-size: 14px;">Royal Pure Spices - Admin Notification</p>
  </div>
</body>
</html>
`;

const handler = async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  // Quick health / config checks
  if (!RESEND_API_KEY) {
    console.error("send-order-email: RESEND_API_KEY is not configured in function environment");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const orderData = await req.json();

    // Basic validation: require orderId and customerEmail
    if (!orderData?.orderId || !orderData?.customerEmail) {
      console.warn("send-order-email: missing required fields", {
        orderId: orderData?.orderId,
        customerEmail: orderData?.customerEmail,
      });
      return new Response(JSON.stringify({ error: "orderId and customerEmail are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Received order email request:", {
      orderId: orderData?.orderId,
      customerEmail: orderData?.customerEmail,
      totalPrice: orderData?.totalPrice,
      itemsCount: Array.isArray(orderData?.items) ? orderData.items.length : 0,
    });

    const results = [];
    const sendErrors = [];

    // Send confirmation email to customer (best-effort)
    if (orderData?.customerEmail) {
      if (!resend) {
        console.error("❌ Cannot send customer email: RESEND_API_KEY not configured");
        sendErrors.push({ type: "customer", error: "RESEND_API_KEY not configured" });
      } else {
        try {
          console.log("📧 Sending customer email to:", orderData.customerEmail);
          const customerEmailResponse = await resend.emails.send({
            from: FROM_EMAIL,
            to: [orderData.customerEmail],
            subject: `Order Confirmation - #${(orderData.orderId || "").slice(0, 8).toUpperCase()}`,
            html: generateCustomerEmailHtml(orderData),
          });
          console.log("✅ Customer email sent:", JSON.stringify(customerEmailResponse, null, 2));
          results.push({ type: "customer", resp: customerEmailResponse });
        } catch (e) {
          console.error("❌ Failed to send customer email:", e);
          sendErrors.push({ type: "customer", error: (e && e.message) || String(e), stack: e?.stack });
        }
      }
    } else {
      console.warn("⚠️  No customerEmail provided; skipping customer email");
    }

    // Send alert email to admin if email provided
    const adminEmail = orderData?.adminEmail || Deno.env.get("ADMIN_EMAIL");
    if (adminEmail) {
      if (!resend) {
        console.error("❌ Cannot send admin email: RESEND_API_KEY not configured");
        sendErrors.push({ type: "admin", error: "RESEND_API_KEY not configured" });
      } else {
        try {
          console.log("📧 Sending admin email to:", adminEmail);
          const adminEmailResponse = await resend.emails.send({
            from: FROM_EMAIL,
            to: [adminEmail],
            subject: `🔔 New Order - #${(orderData.orderId || "").slice(0, 8).toUpperCase()} - ₹${Number(orderData?.totalPrice || 0).toFixed(2)}`,
            html: generateAdminEmailHtml(orderData),
          });
          console.log("✅ Admin email sent:", JSON.stringify(adminEmailResponse, null, 2));
          results.push({ type: "admin", resp: adminEmailResponse });
        } catch (e) {
          console.error("❌ Failed to send admin email:", e);
          sendErrors.push({ type: "admin", error: (e && e.message) || String(e), stack: e?.stack });
        }
      }
    } else {
      console.warn("⚠️  No admin email configured (set ADMIN_EMAIL env var); skipping admin email");
    }

    // Return detailed results but do NOT return a generic 500 for email send failures (best-effort)
    if (sendErrors.length > 0) {
      return new Response(JSON.stringify({ success: false, results, errors: sendErrors }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
