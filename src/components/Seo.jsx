import { Helmet } from "react-helmet-async";

const SITE_URL = "https://e-comm-seven-dun.vercel.app";
const DEFAULT_TITLE = "Royal Pure Spices Pvt Ltd | Premium Natural Hing";
const DEFAULT_DESCRIPTION =
  "Shop Royal Pure Spices for natural premium hing, sourced directly from trusted growers and delivered with care.";

const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noindex = false,
}) => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${safePath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      {noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
};

export { SITE_URL };
export default Seo;
