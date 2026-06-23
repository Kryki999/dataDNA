export const PLANNER_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const PLANNER_ATTACHMENT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export function validatePlannerAttachment(file: File): string | null {
  if (
    !PLANNER_ATTACHMENT_ALLOWED_TYPES.includes(
      file.type as (typeof PLANNER_ATTACHMENT_ALLOWED_TYPES)[number],
    )
  ) {
    return "Dozwolone formaty: JPEG, PNG, WebP, GIF, PDF";
  }
  if (file.size > PLANNER_ATTACHMENT_MAX_BYTES) {
    return "Maksymalny rozmiar pliku to 10 MB";
  }
  return null;
}

export function plannerAttachmentExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "webp", "gif", "pdf"] as const;
  if (fromName && allowed.includes(fromName as (typeof allowed)[number])) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}
