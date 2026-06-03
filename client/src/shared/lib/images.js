export function optimizeImage(url, width = 700) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  if (url.includes('images.unsplash.com')) {
    return url.replace(/w=\d+/g, `w=${width}`).replace(/q=\d+/g, 'q=80');
  }
  if (url.includes('images.pexels.com')) {
    const hasParams = url.includes('?');
    return hasParams
      ? url.replace(/h=\d+/g, 'h=500').replace(/w=\d+/g, `w=${width}`)
      : `${url}?w=${width}&h=500&fit=crop`;
  }
  return url;
}
