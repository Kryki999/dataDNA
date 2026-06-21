import type { LucideIcon } from "lucide-react";
import { Megaphone, Phone } from "lucide-react";
import type { ReachDay, ReachTotals } from "@/lib/types/reach";

export type ReachChannelKey = "coldCalls" | "xImpressions" | "metaClicks";

export type ReachChannelConfig = {
  id: ReachChannelKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** SVG path for X logo (lucide has no X/Twitter brand icon) */
  customIcon?: "x";
  color: string;
  glowColor: string;
  inputLabel: string;
  inputPlaceholder: string;
  submitLabel: string;
};

export const REACH_CHANNELS: ReachChannelConfig[] = [
  {
    id: "coldCalls",
    label: "Cold Calling",
    shortLabel: "Calls",
    icon: Phone,
    color: "#0055FF",
    glowColor: "rgba(0, 85, 255, 0.35)",
    inputLabel: "Liczba telefonów (+)",
    inputPlaceholder: "0",
    submitLabel: "Loguj telefony",
  },
  {
    id: "xImpressions",
    label: "X",
    shortLabel: "X",
    icon: Phone,
    customIcon: "x",
    color: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.35)",
    inputLabel: "Zasięgi X (+)",
    inputPlaceholder: "0",
    submitLabel: "Loguj zasięgi X",
  },
  {
    id: "metaClicks",
    label: "Meta Ads",
    shortLabel: "Meta",
    icon: Megaphone,
    color: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.35)",
    inputLabel: "Kliki Meta (+)",
    inputPlaceholder: "0",
    submitLabel: "Loguj kliki Meta",
  },
];

export function getChannelValue(
  totals: ReachTotals,
  channel: ReachChannelKey,
): number {
  return totals[channel];
}

export function getDayChannelValue(
  day: ReachDay,
  channel: ReachChannelKey,
): number {
  return day[channel];
}

export function buildChannelSparkline(
  series: ReachDay[],
  channel: ReachChannelKey,
  days = 14,
): { date: string; value: number }[] {
  const slice = series.slice(-days);
  if (slice.length > 0) {
    return slice.map((day) => ({
      date: day.date,
      value: getDayChannelValue(day, channel),
    }));
  }

  return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
    date: `d${i}`,
    value: 0,
  }));
}

export type ChannelTrend = {
  direction: "up" | "down" | "flat";
  percent: number;
};

export function getChannelTrend(
  series: ReachDay[],
  channel: ReachChannelKey,
): ChannelTrend {
  const recent = series.slice(-7);
  const previous = series.slice(-14, -7);

  const recentSum = recent.reduce(
    (sum, day) => sum + getDayChannelValue(day, channel),
    0,
  );
  const previousSum = previous.reduce(
    (sum, day) => sum + getDayChannelValue(day, channel),
    0,
  );

  if (previousSum === 0) {
    if (recentSum === 0) return { direction: "flat", percent: 0 };
    return { direction: "up", percent: 100 };
  }

  const pct = Math.round(((recentSum - previousSum) / previousSum) * 100);
  if (pct === 0) return { direction: "flat", percent: 0 };
  return { direction: pct > 0 ? "up" : "down", percent: Math.abs(pct) };
}
