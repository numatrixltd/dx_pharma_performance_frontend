/** Inserts a Cloudinary transformation into an existing delivery URL. Non-Cloudinary URLs are returned unchanged. */
export function cloudinaryUrl(url, transform) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  
  /** Small square avatar, face-centred, 2x for sharp retina screens. */
  export const avatarUrl = (url, size = 48) => cloudinaryUrl(url, `c_fill,g_face,w_${size * 2},h_${size * 2},q_auto,f_auto`);
  
  /** Large hero photo: keeps the original aspect ratio, never upscales. */
  export const heroUrl = (url) => cloudinaryUrl(url, 'c_limit,w_1400,q_auto:best,f_auto');