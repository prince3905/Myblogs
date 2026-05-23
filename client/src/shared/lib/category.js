export function catSlug(category) {
  if (!category) return 'blog';
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog';
}

export function postUrl(post) {
  if (!post || !post.slug) return '/blog';
  return `/blog/${catSlug(post.category)}/${post.slug}`;
}
