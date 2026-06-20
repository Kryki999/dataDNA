export const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}

export function usernameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? "user";
  const sanitized = sanitizeUsername(prefix);
  return sanitized.length >= 3 ? sanitized : `${sanitized}user`.slice(0, 30);
}
