/** Minimum similarity (0–1) to force picking an existing client instead of silent create. */
export const FUZZY_MATCH_THRESHOLD = 0.75;

export function normalizeClientName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length]!;
}

export function similarityScore(query: string, candidate: string): number {
  const nq = normalizeClientName(query);
  const nc = normalizeClientName(candidate);
  if (!nq || !nc) return 0;
  if (nq === nc) return 1;
  if (nc.includes(nq) || nq.includes(nc)) return 0.92;

  const maxLen = Math.max(nq.length, nc.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(nq, nc) / maxLen;
}

export type ClientNameFields = {
  name: string;
  company: string | null;
};

export function scoreClientMatch(
  query: string,
  client: ClientNameFields,
): number {
  const labels = [
    client.company,
    client.name,
    client.company && client.name
      ? `${client.company} ${client.name}`
      : null,
  ].filter((label): label is string => Boolean(label?.trim()));

  if (labels.length === 0) return 0;
  return Math.max(...labels.map((label) => similarityScore(query, label)));
}

export function getClientDisplayName(client: ClientNameFields): string {
  return client.company?.trim() || client.name.trim();
}
