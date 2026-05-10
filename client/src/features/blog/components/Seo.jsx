import { Helmet } from 'react-helmet-async';

export default function Seo({ title, description, image, url, canonical, keywords, jsonLd }) {
  const siteName = 'Digital Home';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const desc = description || 'Premium AI consulting insights and modern web solutions.';
  const pageUrl = url || window.location.href;
  const canonicalUrl = canonical || pageUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={jsonLd ? 'article' : 'website'} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
