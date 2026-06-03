export function optimizeImage(url, width = 500) {
  if (!url) return url;

  const isCloudinary = url.includes('res.cloudinary.com') || url.includes('/myblogs/') || url.includes('myblogs/');

  if (isCloudinary) {
    let fullUrl = url;
    if (!url.includes('res.cloudinary.com')) {
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      fullUrl = `https://res.cloudinary.com/drkm1wo9o/image/upload/${cleanPath}`;
    }

    // Programmatically strip/swap extensions to clear payload overhead
    let clean = fullUrl.replace(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i, '');

    if (clean.includes('/upload/')) {
      const parts = clean.split('/upload/');
      const subparts = parts[1].split('/');
      const mainPathIdx = subparts.findIndex(
        p => (p.startsWith('v') && /^\d+$/.test(p.slice(1))) || p === 'myblogs'
      );
      const mainPath = subparts.slice(mainPathIdx >= 0 ? mainPathIdx : 0).join('/');
      return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${mainPath}`;
    }
    return clean;
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
