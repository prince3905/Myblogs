export function catSlug(category) {
  if (!category) return 'sarkari-jobs-exams';
  let slug = String(category).toLowerCase();
  slug = slug.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'sarkari-jobs-exams';
}

export function postUrl(post) {
  if (!post || !post.slug) return '/blog';

  let rawSlug = String(post.slug).trim();
  // Strip nested domain or relative prefixes if present inside slug
  rawSlug = rawSlug.replace(/^https?:\/\/(?:www\.)?digitalhomeblog\.in/i, '');
  rawSlug = rawSlug.replace(/^\/?blog\/[^\/]+\//i, '');
  rawSlug = rawSlug.replace(/\/digitalhomeblog\.in\/?/gi, '/');
  rawSlug = rawSlug.replace(/digitalhomeblog\.in\/?/gi, '');
  rawSlug = rawSlug.replace(/^\/+|\/+$/g, '');

  const categorySlug = catSlug(post.category);
  return `/blog/${categorySlug}/${rawSlug}`;
}
