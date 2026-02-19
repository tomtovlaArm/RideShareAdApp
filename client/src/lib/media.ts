export function proxyMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/media-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
