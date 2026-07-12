import { Helmet } from 'react-helmet-async';

export default function Seo({ title, description, image, url, canonical, keywords, jsonLd, noindex }) {
  const siteName = 'Digital Home Sarkari Result';
  
  let cleanTitle = title || '';
  // Strip any trailing "| Digital Home" or "| Inkspire Blog" or "| Sarkari Result" suffixes
  cleanTitle = cleanTitle.replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '');

  const fullTitle = cleanTitle ? `${cleanTitle} | ${siteName}` : siteName;
  const desc = description || 'Sarkari Result, Admit Card, Latest Jobs, Vacancies, Sarkari Result Tools, Kids Games (बचो का गेम), Health, Education, Tech, and Career Insights from Digital Home Blog.';
  const pageUrl = url || window.location.href;
  const canonicalUrl = canonical || pageUrl;
  const keys = keywords || 'Sarkari Result, Admit Card, Latest Jobs, Govt Vacancies, Sarkari Result Tools, Kids Games, Bacho Ka Game, Health Tips, Education, Tech Insights, All Insights Blog, Digital Home';

  const enhanceSingle = (schema) => {
    if (!schema) return null;
    if (schema.publisher) {
      return {
        ...schema,
        publisher: {
          ...schema.publisher,
          logo: schema.publisher.logo || {
            '@type': 'ImageObject',
            url: `${window.location.origin}/logo.png`,
            width: 190,
            height: 60
          }
        }
      };
    }
    return schema;
  };

  const enhancedJsonLd = Array.isArray(jsonLd)
    ? jsonLd.map(enhanceSingle).filter(Boolean)
    : enhanceSingle(jsonLd);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={desc} />
      <meta name="robots" content={noindex ? "noindex, follow" : "max-image-preview:large, index, follow"} />
      <meta name="keywords" content={keys} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={jsonLd ? 'article' : 'website'} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}
      {jsonLd?.datePublished && <meta property="article:published_time" content={jsonLd.datePublished} />}
      {jsonLd?.dateModified && <meta property="article:modified_time" content={jsonLd.dateModified} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://digitalhomeblog.in'}/#organization`,
          'name': siteName,
          'alternateName': [
            "Digital Home",
            "Digital Home Blog",
            "Sarkari Result Digital Home",
            "Digital Home Health",
            "Digital Home Education",
            "Digital Home Insights",
            "All Insights Blog",
            "Sarkari Result Tool",
            "Digital Home Kids Games"
          ],
          'url': typeof window !== 'undefined' ? window.location.origin : 'https://digitalhomeblog.in',
          'logo': {
            '@type': 'ImageObject',
            'url': `${typeof window !== 'undefined' ? window.location.origin : 'https://digitalhomeblog.in'}/logo.png`,
            'width': 190,
            'height': 60
          }
        })}
      </script>

      {enhancedJsonLd && (
        Array.isArray(enhancedJsonLd) ? (
          enhancedJsonLd.map((schema, idx) => (
            <script key={idx} type="application/ld+json">{JSON.stringify(schema)}</script>
          ))
        ) : (
          <script type="application/ld+json">{JSON.stringify(enhancedJsonLd)}</script>
        )
      )}
    </Helmet>
  );
}
