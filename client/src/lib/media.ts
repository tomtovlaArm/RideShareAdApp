export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function getMediaSrc(url: string): string {
  if (!url) return url;
  if (isExternalUrl(url)) {
    return `/api/media-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
