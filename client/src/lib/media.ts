const resolvedCache = new Map<string, string>();

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export async function resolveMediaUrl(url: string): Promise<string> {
  if (!url || !isExternalUrl(url)) return url;

  const cached = resolvedCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/media-resolve?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      const directUrl = data.directUrl || url;
      resolvedCache.set(url, directUrl);
      return directUrl;
    }
  } catch (e) {
    console.error("Failed to resolve media URL:", e);
  }
  return url;
}

export function proxyMediaUrl(url: string): string {
  if (!url) return url;
  return url;
}
