// CJ's CDN resizes on the fly: a 500 KB photo becomes ~35 KB at card size.
export function img(url: string | undefined, width: number) {
  if (!url) return "";
  if (/cjdropshipping\.com\//.test(url) && !url.includes("x-oss-process")) {
    return `${url}${url.includes("?") ? "&" : "?"}x-oss-process=image/resize,w_${width}/format,webp`;
  }
  return url;
}
