export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function isVercelBlobUrl(url: string) {
  return url.includes(".blob.vercel-storage.com");
}

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
    return "Dozwolone formaty: JPEG, PNG, WebP, GIF";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Maksymalny rozmiar zdjęcia to 2 MB";
  }
  return null;
}

export function avatarExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"] as const;
  if (fromName && allowed.includes(fromName as (typeof allowed)[number])) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}
