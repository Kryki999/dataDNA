import { format, parseISO, subDays } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  getDateKeysBetween,
  getTodayDateKey,
  toWarsawDateKey,
} from "@/lib/timezone";

export type RevenueTimeRange = "7" | "30" | "90";

export type RevenueDealPoint = {
  closedAt: Date;
  amountPln: number;
};

export type RevenueChartPoint = {
  date: string;
  label: string;
  value: number;
  daily: number;
};

export const REVENUE_TIME_RANGE_LABELS: Record<RevenueTimeRange, string> = {
  "7": "7 DAYS",
  "30": "30 DAYS",
  "90": "90 DAYS",
};

function formatChartLabel(dateKey: string): string {
  return format(parseISO(dateKey), "MMM d", { locale: enUS }).toUpperCase();
}

export function buildRevenueChartData(
  deals: RevenueDealPoint[],
  range: RevenueTimeRange,
): RevenueChartPoint[] {
  const today = getTodayDateKey();
  const days = Number(range);
  const rangeStart = toWarsawDateKey(subDays(new Date(), days - 1));
  const rangeKeys = getDateKeysBetween(rangeStart, today);

  const dailyAmounts = new Map<string, number>();
  for (const deal of deals) {
    const key = toWarsawDateKey(deal.closedAt);
    dailyAmounts.set(key, (dailyAmounts.get(key) ?? 0) + deal.amountPln);
  }

  if (deals.length === 0) {
    return rangeKeys.map((date) => ({
      date,
      label: formatChartLabel(date),
      value: 0,
      daily: 0,
    }));
  }

  const firstDealKey = deals.reduce((earliest, deal) => {
    const key = toWarsawDateKey(deal.closedAt);
    return key < earliest ? key : earliest;
  }, toWarsawDateKey(deals[0]!.closedAt));

  let runningTotal = 0;
  const cumulativeByDate = new Map<string, number>();
  for (const key of getDateKeysBetween(firstDealKey, today)) {
    runningTotal += dailyAmounts.get(key) ?? 0;
    cumulativeByDate.set(key, runningTotal);
  }

  let lastValue = 0;
  for (const key of getDateKeysBetween(firstDealKey, rangeStart)) {
    if (cumulativeByDate.has(key)) {
      lastValue = cumulativeByDate.get(key)!;
    }
  }

  return rangeKeys.map((date) => {
    const value = cumulativeByDate.get(date) ?? lastValue;
    lastValue = value;
    return {
      date,
      label: formatChartLabel(date),
      value,
      daily: dailyAmounts.get(date) ?? 0,
    };
  });
}
