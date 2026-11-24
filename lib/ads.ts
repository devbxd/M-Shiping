// House ads. Currently none on the site.
// The previous ads (text, links, images) are kept locally in _private/ads/ (not in git).
// To bring them back: copy _private/ads/ads.ts over this file, the images to public/ads/,
// and set ADS_ENABLED = true.
export type Ad = {
  id: string;
  brand: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image?: string;
  bg: string;
  fg: string;
  accent: string;
};

export const ADS_ENABLED = false;
export const ADS: Ad[] = [];
