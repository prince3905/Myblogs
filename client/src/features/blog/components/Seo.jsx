import { Helmet } from 'react-helmet-async';
import { normalizeCanonicalUrl } from '../../../shared/lib/urlUtils';

export default function Seo({ title, description, image, url, canonical, keywords, jsonLd, noindex }) {
  const siteName = 'Digital Home Sarkari Result';
  
  let cleanTitle = title || '';
  // Strip any trailing "| Digital Home" or "| Inkspire Blog" or "| Sarkari Result" suffixes
  cleanTitle = cleanTitle.replace(/\s*\|\s*(Digital Home|Inkspire Blog|Sarkari Result)\s*$/i, '');

  const isHomepageOrBrandTitle = cleanTitle.startsWith('Digital Home');
  const fullTitle = isHomepageOrBrandTitle 
    ? cleanTitle 
    : (cleanTitle ? `${cleanTitle} | ${siteName}` : siteName);
  const desc = description || 'Sarkari Result, Admit Card, Latest Jobs, Vacancies, Sarkari Result Tools, Kids Games (बचो का गेम), Health, Education, Tech, and Career Insights from Digital Home Blog.';
  
  const currentHref = typeof window !== 'undefined' ? window.location.href : 'https://www.digitalhomeblog.in';
  const pageUrl = normalizeCanonicalUrl(url || currentHref);
  const canonicalUrl = normalizeCanonicalUrl(canonical || url || currentHref);
  const keys = keywords || 'Digital Home, Sarkari Result, सरकारी रिजल्ट 2026, Latest Jobs, सरकारी नौकरी, Live Job Alerts, Admit Card, प्रवेश पत्र, Sarkari Exam, Online Form, Govt Vacancies, Sarkari Result Tools, Kids Games, Bacho Ka Game, Health Tips, Education, Tech Tutorials, All Insights Blog';

  const isValidSchema = (s) => {
    return s && typeof s === 'object' && !Array.isArray(s) && Object.keys(s).length > 0 && !!s['@type'];
  };

  const enhanceSingle = (schema) => {
    if (!isValidSchema(schema)) return null;
    if (schema.publisher) {
      return {
        ...schema,
        publisher: {
          ...schema.publisher,
          logo: schema.publisher.logo || {
            '@type': 'ImageObject',
            url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.digitalhomeblog.in'}/logo.webp`,
            width: 190,
            height: 60
          }
        }
      };
    }
    return schema;
  };

  const validSchemas = (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    .map(enhanceSingle)
    .filter(isValidSchema);

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
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.digitalhomeblog.in'}/#organization`,
          'name': siteName,
          'alternateName': [
            "Digital Home",
            "Digital Home Blog",
            "Sarkari Result Digital Home",
            "सरकारी रिजल्ट 2026",
            "सरकारी रिजल्ट डिजिटल होम",
            "सरकारी नौकरी अलर्ट",
            "Digital Home Health",
            "Digital Home Education",
            "Digital Home Insights",
            "All Insights Blog",
            "Sarkari Result Tool",
            "Digital Home Kids Games"
          ],
          'url': typeof window !== 'undefined' ? window.location.origin : 'https://www.digitalhomeblog.in',
          'logo': {
            '@type': 'ImageObject',
            'url': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.digitalhomeblog.in'}/logo.webp`,
            'width': 190,
            'height': 60
          }
        })}
      </script>

      {validSchemas.map((schema, idx) => (
        <script key={idx} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Helmet>
  );
}
