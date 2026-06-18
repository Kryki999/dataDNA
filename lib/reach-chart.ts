import type { ReachDay } from "@/lib/types/reach";
import {
  getDateKeysBetween,
  getTodayDateKey,
  toWarsawDateKey,
} from "@/lib/timezone";
import { subDays } from "date-fns";

export type ReachTimeRange = "3" | "7" | "30" | "all";
export type ReachChannel = "total" | "coldCalls" | "xImpressions" | "metaClicks";

export type ReachChartPoint = {
  date: string;
  label: string;
  value: number;
  daily: number;
};

function getChannelValue(day: ReachDay, channel: ReachChannel): number {
  if (channel === "total") {
    return day.total;
  }
  return day[channel];
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
  channel: ReachChannel,
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
      total: 0,
    };
    const daily = getChannelValue(day, channel);
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

export const REACH_CHANNEL_LABELS: Record<ReachChannel, string> = {
  total: "Łącznie",
  coldCalls: "Cold Calling",
  xImpressions: "X",
  metaClicks: "Meta Ads",
};
