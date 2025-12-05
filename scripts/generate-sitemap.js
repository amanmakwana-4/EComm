/*
  scripts/generate-sitemap.js

  Usage:
    - Set env vars SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment.
    - Run: `node scripts/generate-sitemap.js` (requires Node 18+ for global fetch)

  What it does:
    - Fetches products from Supabase `products` table using the REST API.
    - Builds `public/sitemap.xml` including static routes and product-derived routes.
    - If products contain a `slug` field, it uses `/product/<slug>`. Otherwise it adds `/product?id=<id>`.
*/

import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "sitemap.xml");
const SITE_URL = process.env.SITE_URL || "https://yourdomain.com"; // replace with your site URL or set SITE_URL env var

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY not set. The sitemap will contain static pages only.");
}

async function fetchProducts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const url = `${SUPABASE_URL}/rest/v1/products?select=id,name,created_at,slug`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) {
      console.error("Failed to fetch products:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
}

function buildUrlEntry(loc, lastmod, priority = 0.5, changefreq = "monthly") {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

(async () => {
  const staticRoutes = ["/", "/product", "/about", "/contact", "/cart", "/checkout", "/auth"];

  const products = await fetchProducts();

  const entries = [];

  for (const route of staticRoutes) {
    entries.push(buildUrlEntry(`${SITE_URL}${route}`, null, route === "/" ? 1.0 : 0.6, route === "/" ? "daily" : "weekly"));
  }

  for (const p of products) {
    const id = p.id;
    const slug = p.slug;
    const created = p.created_at;

    let loc;
    if (slug) {
      loc = `${SITE_URL}/product/${encodeURIComponent(slug)}`;
    } else {
      // If there is no slug, include a product-specific query URL so crawlers can discover
      loc = `${SITE_URL}/product?id=${encodeURIComponent(id)}`;
    }

    entries.push(buildUrlEntry(loc, created, 0.8, "weekly"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  try {
    fs.writeFileSync(OUTPUT_PATH, xml, "utf8");
    console.log(`Sitemap written to ${OUTPUT_PATH}. Entries: ${entries.length}`);
    console.log(`Remember to replace SITE_URL in environment or set SITE_URL to your production URL.`);
  } catch (e) {
    console.error("Failed to write sitemap:", e);
    process.exit(1);
  }
})();
