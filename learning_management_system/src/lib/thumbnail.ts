export const ALLOWED_THUMBNAIL_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "img.youtube.com",
  "i.ytimg.com",
  "images.pexels.com",
  "dummyimage.com",
  "placehold.co",
] as const;

export function isValidThumbnailUrl(url: string | null | undefined): boolean {
  if (!url) return true; // Optional thumbnail
  if (typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_THUMBNAIL_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}
