import type { ReachDay } from "@/lib/types/reach";
import {
  getDateKeysBetween,
  getTodayDateKey,
  toWarsawDateKey,
} from "@/lib/timezone";
import { subDays } from "date-fns";

export type ReachTimeRange = "3" | "7" | "30" | "all";
export type ReachTrafficFilter = "all" | "paid" | "organic";

export type ReachChartChannel =
  | "total"
  | "cold_calls"
  | "x"
  | "facebook"
  | "instagram"
  | "website"
  | "metaClicks";

/** @deprecated */
export type ReachChannel = ReachChartChannel;

export type ReachChartPoint = {
  date: string;
  label: string;
  value: number;
  daily: number;
};

function getChannelValue(
  day: ReachDay,
  channel: ReachChartChannel,
  traffic: ReachTrafficFilter,
): number {
  if (channel === "total") {
    return day.total;
  }
  if (channel === "metaClicks") {
    return day.metaClicks;
  }
  if (channel === "cold_calls") return day.coldCalls;
  if (channel === "x") return day.xImpressions;

  if (channel === "facebook") {
    if (traffic === "paid") return day.facebookPaidClicks;
    if (traffic === "organic") return day.facebookOrganicReach;
    return day.facebookPaidClicks + day.facebookOrganicReach;
  }
  if (channel === "instagram") {
    if (traffic === "paid") return day.instagramPaidClicks;
    if (traffic === "organic") return day.instagramOrganicReach;
    return day.instagramPaidClicks + day.instagramOrganicReach;
  }
  if (channel === "website") {
    if (traffic === "paid") return day.websitePaidPageviews;
    if (traffic === "organic") return day.websiteOrganicPageviews;
    return day.websitePaidPageviews + day.websiteOrganicPageviews;
  }
  return 0;
}

function getRangeStart(range: ReachTimeRange, series: ReachDay[]): string {
  const today = getTodayDateKey();
  if (range === "all") {
    return series[0]?.date ?? today;
  }
  const days = Number(range);
  return toWarsawDateKey(subDays(new Date(), days - 1));
}

export function buildReachChartData(
  series: ReachDay[],
  range: ReachTimeRange,
  channel: ReachChartChannel,
  traffic: ReachTrafficFilter = "all",
): ReachChartPoint[] {
  if (series.length === 0) {
    return [];
  }

  const today = getTodayDateKey();
  const start = getRangeStart(range, series);
  const byDate = new Map(series.map((day) => [day.date, day]));
  const dateKeys = getDateKeysBetween(start, today);

  let cumulative = 0;

  return dateKeys.map((date) => {
    const day = byDate.get(date) ?? {
      date,
      coldCalls: 0,
      xImpressions: 0,
      metaClicks: 0,
      facebookPaidClicks: 0,
      instagramPaidClicks: 0,
      facebookOrganicReach: 0,
      instagramOrganicReach: 0,
      websitePaidPageviews: 0,
      websiteOrganicPageviews: 0,
      websitePaidVisitors: 0,
      websiteOrganicVisitors: 0,
      total: 0,
    };
    const daily = getChannelValue(day, channel, traffic);
    cumulative += daily;

    return {
      date,
      label: date.slice(5).replace("-", "/"),
      value: cumulative,
      daily,
    };
  });
}

export const REACH_TIME_RANGE_LABELS: Record<ReachTimeRange, string> = {
  "3": "3 dni",
  "7": "7 dni",
  "30": "30 dni",
  all: "Cały czas",
};

export const REACH_CHANNEL_LABELS: Record<ReachChartChannel, string> = {
  total: "Łącznie",
  cold_calls: "Cold Calling",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  website: "Strona WWW",
  metaClicks: "Meta Ads",
};

export const REACH_TRAFFIC_LABELS: Record<ReachTrafficFilter, string> = {
  all: "Oba",
  paid: "Płatne",
  organic: "Organiczne",
};

export const CHANNEL_CHART_COLORS: Record<ReachChartChannel, string> = {
  total: "#0055FF",
  cold_calls: "#0055FF",
  x: "#38bdf8",
  facebook: "#1877F2",
  instagram: "#E1306C",
  website: "#34d399",
  metaClicks: "#a78bfa",
};
