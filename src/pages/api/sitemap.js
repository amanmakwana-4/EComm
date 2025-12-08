export default function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  // Load the static XML from the public folder
  const xml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://e-comm-seven-dun.vercel.app/</loc>
    </url>
  </urlset>
  `;

  res.status(200).send(xml);
}
