import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const generateEmailHtml = (payload) => `
  <h2>New contact form submission</h2>
  <p><strong>Name:</strong> ${payload.name}</p>
  <p><strong>Email:</strong> ${payload.email}</p>
  <p><strong>Phone:</strong> ${payload.phone || "-"}</p>
  <p><strong>Message:</strong></p>
  <p>${(payload.message || "").replace(/\n/g, "<br />")}</p>
`;

const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Ensure Resend is configured
  if (!resend) {
    console.error("send-contact-message: RESEND_API_KEY is not configured in function environment");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "name, email and message are required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const results = [];
    const errors = [];

    // Send admin notification if ADMIN_EMAIL configured
    if (ADMIN_EMAIL) {
      try {
        const resp = await resend.emails.send({
          from: "Royal Pure Spices <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `New contact form: ${name}`,
          html: generateEmailHtml({ name, email, phone, message }),
        });
        results.push({ type: "admin_email", resp });
      } catch (e) {
        console.error("Failed to send admin email:", e);
        errors.push({ type: "admin_email", error: String(e) });
      }
    } else {
      console.warn("ADMIN_EMAIL not configured; skipping admin notification");
    }

    // Send acknowledgement to the user (best-effort)
    try {
      const respUser = await resend.emails.send({
        from: "Royal Pure Spices <onboarding@resend.dev>",
        to: [email],
        subject: `Thanks for contacting Royal Pure Spices, ${name}`,
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for reaching out. We've received your message and will get back to you soon.</p>
          <hr />
          ${generateEmailHtml({ name, email, phone, message })}
        `,
      });
      results.push({ type: "user_email", resp: respUser });
    } catch (e) {
      console.error("Failed to send user acknowledgement email:", e);
      errors.push({ type: "user_email", error: String(e) });
    }

    return new Response(JSON.stringify({ success: true, results, errors }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error) {
    console.error("Error in send-contact-message function:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
