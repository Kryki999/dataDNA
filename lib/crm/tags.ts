import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";

const TAG_COLORS: Record<string, string> = {
  Detailing: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Next.js": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  React: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "E-commerce": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Wysłane Demo": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Umówiony Call": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Decydent: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Brak Budżetu": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Follow-up": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Odrzucił: "bg-red-500/20 text-red-300 border-red-500/30",
};

const FALLBACK_COLORS = [
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
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
