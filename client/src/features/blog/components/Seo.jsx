import { useEffect } from 'react';

export default function Seo({ title, description, image, url }) {
  useEffect(() => {
    // Update title
    document.title = title || 'Inkspire Blog';
    
    // Update or create meta tags
    const updateMeta = (name, content, property = false) => {
      let meta;
      if (property) {
        meta = document.querySelector(`meta[property="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', name);
          document.head.appendChild(meta);
        }
      } else {
        meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.appendChild(meta);
        }
      }
      meta.content = content || '';
    };

    // Basic meta tags
    updateMeta('description', description || 'Modern MERN blogging website.');
    
    // Open Graph tags for social preview
    updateMeta('og:title', title || 'Inkspire Blog', true);
    updateMeta('og:description', description || 'Modern MERN blogging website.', true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:url', url || window.location.href, true);
    if (image) {
      updateMeta('og:image', image, true);
    }
    
    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title || 'Inkspire Blog');
    updateMeta('twitter:description', description || 'Modern MERN blogging website.');
    if (image) {
      updateMeta('twitter:image', image);
    }
  }, [title, description, image, url]);

  return null;
}
