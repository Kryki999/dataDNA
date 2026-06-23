import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";

const TAG_COLORS: Record<string, string> = {
  Detailing: "bg-violet-500/12 text-violet-400/90 border-violet-500/20",
  "Next.js": "bg-blue-500/12 text-blue-400/90 border-blue-500/20",
  React: "bg-cyan-500/12 text-cyan-400/90 border-cyan-500/20",
  "E-commerce": "bg-amber-500/12 text-amber-400/90 border-amber-500/20",
  "Wysłane Demo": "bg-indigo-500/12 text-indigo-400/90 border-indigo-500/20",
  "Umówiony Call": "bg-emerald-500/12 text-emerald-400/90 border-emerald-500/20",
  Decydent: "bg-rose-500/12 text-rose-400/90 border-rose-500/20",
  "Brak Budżetu": "bg-zinc-500/12 text-zinc-400/90 border-zinc-500/20",
  "Follow-up": "bg-orange-500/12 text-orange-400/90 border-orange-500/20",
  Odrzucił: "bg-red-500/12 text-red-400/90 border-red-500/20",
};

const FALLBACK_COLORS = [
  "bg-purple-500/12 text-purple-400/90 border-purple-500/20",
  "bg-sky-500/12 text-sky-400/90 border-sky-500/20",
  "bg-teal-500/12 text-teal-400/90 border-teal-500/20",
  "bg-pink-500/12 text-pink-400/90 border-pink-500/20",
];

export function getTagColorClass(tag: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  const index =
    Math.abs(tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}

export function isKnownTag(tag: string): boolean {
  return (PREDEFINED_LEAD_TAGS as readonly string[]).includes(tag);
}
