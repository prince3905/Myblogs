export function optimizeImage(url, width = 380, height = null) {
  if (!url) return url;

  const isCloudinary = url.includes('res.cloudinary.com') || url.includes('/myblogs/') || url.includes('myblogs/');

  if (isCloudinary) {
    let fullUrl = url;
    if (!url.includes('res.cloudinary.com')) {
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      fullUrl = `https://res.cloudinary.com/drkm1wo9o/image/upload/${cleanPath}`;
    }

    let clean = fullUrl.replace(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i, '');

    if (clean.includes('/upload/')) {
      const parts = clean.split('/upload/');
      const subparts = parts[1].split('/');
      const mainPathIdx = subparts.findIndex(
        p => (p.startsWith('v') && /^\d+$/.test(p.slice(1))) || p === 'myblogs'
      );
      const mainPath = subparts.slice(mainPathIdx >= 0 ? mainPathIdx : 0).join('/');
      const h = height || Math.round(width * 9 / 16);
      return `${parts[0]}/upload/f_webp,q_auto:eco,w_${width},h_${h},c_fill,g_auto/${mainPath}`;
    }
    return clean;
  }

  if (url.includes('images.unsplash.com')) {
    const h = height || Math.round(width * 9 / 16);
    let base = url.split('?')[0];
    return `${base}?w=${width}&h=${h}&fit=crop&q=45&fm=webp&auto=format`;
  }

  if (url.includes('images.pexels.com')) {
    const base = url.split('?')[0];
    const h = height || Math.round(width * 9 / 16);
    return `${base}?w=${width}&h=${h}&fit=crop&auto=compress&cs=tinysrgb&dpr=1&fm=webp&q=45`;
  }

  return url;
}

