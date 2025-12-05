SEO & Sitemap — Quick Guide

This project includes a small sitemap generator and guidance to help register your site with Google Search Console.

1) Auto-generate `sitemap.xml`

- Purpose: include product pages and static routes so search engines can crawl your site.
- Script: `scripts/generate-sitemap.js`

Requirements:
- Node 18+ (uses global `fetch`).
- Environment variables:
  - `SUPABASE_URL` — your Supabase project URL (e.g. https://xyz.supabase.co)
  - `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` — key for reading `products` (anon is fine for public reads).
  - Optional: `SITE_URL` — your site URL (e.g. https://royalpurespices.com). If not set, the script uses `https://yourdomain.com` as placeholder.

Run locally:
```powershell
# set env vars (PowerShell example)
$env:SUPABASE_URL = "https://xyz.supabase.co"
$env:SUPABASE_ANON_KEY = "your-anon-key"
$env:SITE_URL = "https://royalpurespices.com"
node scripts/generate-sitemap.js
```

This will write `public/sitemap.xml`. Commit it or include it in your build artifact.

NPM scripts added:
- `npm run generate:sitemap` — runs the generator.
- `npm run build:with-sitemap` — runs generator then `vite build`.

2) Robots & meta
- Update `public/robots.txt` and `index.html` to replace `https://yourdomain.com` with your actual deployed site URL.
- Add an `og-image.png` to `public/` for better social previews (1200×630 recommended).

3) Deploy your site (Vercel/Netlify/Cloudflare Pages recommended)
- Deploy as usual. If you want dynamic sitemap generation on deploy, run `npm run generate:sitemap` as a build step in your deployment settings.

4) Google Search Console
- Go to https://search.google.com/search-console
- Add your property (Domain or URL prefix). Verify ownership.
- Submit `https://yourdomain.com/sitemap.xml` under Sitemaps.

Notes and recommendations
- If you want product URLs like `/product/<slug>`, add a `slug` column to your `products` table and update product pages to use `:slug` routes; the generator uses `slug` when available.
- For strict security, the script fetches product data with your Supabase key — use an `anon` key for public reads or the service role key if necessary. Do NOT commit service role keys to source control.
- If you prefer server-side generation (e.g., on every deploy), integrate `npm run generate:sitemap` into your CI/CD build pipeline.

If you want, I can:
- Add a CI step (GitHub Actions) to run `generate:sitemap` on push and commit the generated file to `public/`.
- Add `slug` migration and update product pages to have per-product routes.
- Create a script to generate a JSON file of products for other uses.
