import type { LucideIcon } from "lucide-react";
import { Globe, Megaphone, Phone } from "lucide-react";
import type {
  ReachChannelGroupData,
  ReachChannelId,
  ReachDay,
  ReachMetricKind,
  ReachSummary,
  ReachTotals,
  ReachTrafficType,
} from "@/lib/types/reach";

export type ReachInputMode = "manual" | "api" | "hybrid";

export type ReachLaneConfig = {
  trafficType: "paid" | "organic";
  primaryMetric: ReachMetricKind;
  secondaryMetrics: ReachMetricKind[];
  primaryLabel: string;
  secondaryLabels: Partial<Record<ReachMetricKind, string>>;
  apiProvider?: "meta" | "vercel-analytics" | "x";
  colorOpacity?: number;
};

export type ReachChannelConfig = {
  id: ReachChannelId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  customIcon?: "x" | "facebook" | "instagram";
  color: string;
  glowColor: string;
  organicColor?: string;
  inputMode: ReachInputMode;
  lanes?: ReachLaneConfig[];
  inputLabel?: string;
  inputPlaceholder?: string;
  submitLabel?: string;
};

export const REACH_CHANNELS: ReachChannelConfig[] = [
  {
    id: "cold_calls",
    label: "Cold Calling",
    shortLabel: "Calls",
    icon: Phone,
    color: "#0055FF",
    glowColor: "rgba(0, 85, 255, 0.35)",
    inputMode: "manual",
    inputLabel: "Liczba telefonów (+)",
    inputPlaceholder: "0",
    submitLabel: "Loguj telefony",
  },
  {
    id: "x",
    label: "X",
    shortLabel: "X",
    icon: Phone,
    customIcon: "x",
    color: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.35)",
    inputMode: "hybrid",
    inputLabel: "Zasięgi X (+)",
    inputPlaceholder: "0",
    submitLabel: "Loguj zasięgi X",
    lanes: [
      {
        trafficType: "organic",
        primaryMetric: "impressions",
        secondaryMetrics: [],
        primaryLabel: "wyświetlenia",
        secondaryLabels: {},
      },
      {
        trafficType: "paid",
        primaryMetric: "impressions",
        secondaryMetrics: [],
        primaryLabel: "wyświetlenia",
        secondaryLabels: {},
        apiProvider: "x",
        colorOpacity: 0.45,
      },
    ],
  },
  {
    id: "facebook",
    label: "Facebook",
    shortLabel: "FB",
    icon: Megaphone,
    customIcon: "facebook",
    color: "#1877F2",
    organicColor: "rgba(24, 119, 242, 0.45)",
    glowColor: "rgba(24, 119, 242, 0.35)",
    inputMode: "api",
    lanes: [
      {
        trafficType: "paid",
        primaryMetric: "clicks",
        secondaryMetrics: ["impressions"],
        primaryLabel: "kliknięć",
        secondaryLabels: { impressions: "wyświetleń" },
        apiProvider: "meta",
      },
      {
        trafficType: "organic",
        primaryMetric: "reach",
        secondaryMetrics: ["impressions"],
        primaryLabel: "zasięgu",
        secondaryLabels: { impressions: "wyświetleń" },
        apiProvider: "meta",
        colorOpacity: 0.45,
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    shortLabel: "IG",
    icon: Megaphone,
    customIcon: "instagram",
    color: "#E1306C",
    organicColor: "rgba(225, 48, 108, 0.45)",
    glowColor: "rgba(225, 48, 108, 0.35)",
    inputMode: "api",
    lanes: [
      {
        trafficType: "paid",
        primaryMetric: "clicks",
        secondaryMetrics: ["impressions"],
        primaryLabel: "kliknięć",
        secondaryLabels: { impressions: "wyświetleń" },
        apiProvider: "meta",
      },
      {
        trafficType: "organic",
        primaryMetric: "reach",
        secondaryMetrics: ["impressions"],
        primaryLabel: "zasięgu",
        secondaryLabels: { impressions: "wyświetleń" },
        apiProvider: "meta",
        colorOpacity: 0.45,
      },
    ],
  },
  {
    id: "website",
    label: "Strona WWW",
    shortLabel: "WWW",
    icon: Globe,
    color: "#34d399",
    organicColor: "rgba(52, 211, 153, 0.45)",
    glowColor: "rgba(52, 211, 153, 0.35)",
    inputMode: "api",
    lanes: [
      {
        trafficType: "paid",
        primaryMetric: "pageviews",
        secondaryMetrics: ["visitors"],
        primaryLabel: "odsłon",
        secondaryLabels: { visitors: "odwiedzających" },
        apiProvider: "vercel-analytics",
      },
      {
        trafficType: "organic",
        primaryMetric: "pageviews",
        secondaryMetrics: ["visitors"],
        primaryLabel: "odsłon",
        secondaryLabels: { visitors: "odwiedzających" },
        apiProvider: "vercel-analytics",
        colorOpacity: 0.45,
      },
    ],
  },
];

/** @deprecated Use ReachChannelId */
export type ReachChannelKey = "coldCalls" | "xImpressions" | "metaClicks";

export function getChannelConfig(id: ReachChannelId): ReachChannelConfig {
  const channel = REACH_CHANNELS.find((ch) => ch.id === id);
  if (!channel) throw new Error(`Unknown channel: ${id}`);
  return channel;
}

export function metricKey(
  channel: ReachChannelId,
  trafficType: ReachTrafficType,
  metric: ReachMetricKind,
) {
  return `${channel}:${trafficType}:${metric}` as const;
}

export function getLanePrimaryValue(
  channelData: ReachChannelGroupData | undefined,
  trafficType: "paid" | "organic",
): number {
  const lane = channelData?.lanes.find((l) => l.trafficType === trafficType);
  return lane?.metrics.primary.today ?? 0;
}

export function getChannelHeroToday(
  channelData: ReachChannelGroupData | undefined,
  config: ReachChannelConfig,
): number {
  if (!channelData) return 0;
  if (config.inputMode === "manual" || config.id === "cold_calls") {
    return channelData.heroToday;
  }
  return channelData.paidToday + channelData.organicToday;
}

export function buildChannelSparkline(
  series: ReachDay[],
  channel: ReachChannelId,
  trafficType?: "paid" | "organic",
  days = 14,
): { date: string; value: number }[] {
  const slice = series.slice(-days);
  if (slice.length === 0) {
    return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
      date: `d${i}`,
      value: 0,
    }));
  }

  return slice.map((day) => ({
    date: day.date,
    value: getDayChannelValue(day, channel, trafficType),
  }));
}

export function getDayChannelValue(
  day: ReachDay,
  channel: ReachChannelId,
  trafficType?: "paid" | "organic",
): number {
  switch (channel) {
    case "cold_calls":
      return day.coldCalls;
    case "x":
      return day.xImpressions;
    case "facebook":
      if (trafficType === "paid") return day.facebookPaidClicks;
      if (trafficType === "organic") return day.facebookOrganicReach;
      return day.facebookPaidClicks + day.facebookOrganicReach;
    case "instagram":
      if (trafficType === "paid") return day.instagramPaidClicks;
      if (trafficType === "organic") return day.instagramOrganicReach;
      return day.instagramPaidClicks + day.instagramOrganicReach;
    case "website":
      if (trafficType === "paid") return day.websitePaidPageviews;
      if (trafficType === "organic") return day.websiteOrganicPageviews;
      return day.websitePaidPageviews + day.websiteOrganicPageviews;
    default:
      return 0;
  }
}

export function getChannelValue(
  totals: ReachTotals,
  channel: ReachChannelId,
  trafficType?: "paid" | "organic",
): number {
  const day: ReachDay = { date: "", ...totals };
  return getDayChannelValue(day, channel, trafficType);
}

export type ChannelTrend = {
  direction: "up" | "down" | "flat";
  percent: number;
};

export function getChannelTrend(
  series: ReachDay[],
  channel: ReachChannelId,
  trafficType?: "paid" | "organic",
): ChannelTrend {
  const recent = series.slice(-7);
  const previous = series.slice(-14, -7);

  const recentSum = recent.reduce(
    (sum, day) => sum + getDayChannelValue(day, channel, trafficType),
    0,
  );
  const previousSum = previous.reduce(
    (sum, day) => sum + getDayChannelValue(day, channel, trafficType),
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

export function findChannelData(
  summary: ReachSummary,
  channelId: ReachChannelId,
): ReachChannelGroupData | undefined {
  return summary.channels.find((ch) => ch.id === channelId);
}
