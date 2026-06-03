export function optimizeImage(url, width = 500) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  if (url.includes('images.unsplash.com')) {
    return url.replace(/w=\d+/g, `w=${width}`).replace(/q=\d+/g, 'q=80');
  }
  if (url.includes('images.pexels.com')) {
    const base = url.split('?')[0];
    return `${base}?w=450&fit=crop`;
  }
  return url;
}
