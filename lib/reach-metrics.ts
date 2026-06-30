import type {
  ReachChannelGroupData,
  ReachChannelId,
  ReachDay,
  ReachLaneMetricTotals,
  ReachMetricKind,
  ReachTotals,
  ReachTrafficType,
} from "@/lib/types/reach";
import { REACH_CHANNELS, getChannelConfig } from "@/lib/reach-channels";

export type RawMetricRow = {
  dateKey: string;
  channel: ReachChannelId;
  trafficType: ReachTrafficType;
  metric: ReachMetricKind;
  value: number;
};

const EMPTY_TOTALS: ReachTotals = {
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

function getMetricValue(
  map: Map<string, number>,
  channel: ReachChannelId,
  trafficType: ReachTrafficType,
  metric: ReachMetricKind,
): number {
  return map.get(`${channel}:${trafficType}:${metric}`) ?? 0;
}

function buildMetricMap(rows: RawMetricRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.channel}:${row.trafficType}:${row.metric}`;
    map.set(key, (map.get(key) ?? 0) + row.value);
  }
  return map;
}

export function rowsToReachDay(date: string, map: Map<string, number>): ReachDay {
  const coldCalls = getMetricValue(map, "cold_calls", "manual", "clicks");
  const xImpressions = getMetricValue(map, "x", "organic", "impressions");
  const facebookPaidClicks = getMetricValue(
    map,
    "facebook",
    "paid",
    "clicks",
  );
  const instagramPaidClicks = getMetricValue(
    map,
    "instagram",
    "paid",
    "clicks",
  );
  const facebookOrganicReach = getMetricValue(
    map,
    "facebook",
    "organic",
    "reach",
  );
  const instagramOrganicReach = getMetricValue(
    map,
    "instagram",
    "organic",
    "reach",
  );
  const websitePaidPageviews = getMetricValue(
    map,
    "website",
    "paid",
    "pageviews",
  );
  const websiteOrganicPageviews = getMetricValue(
    map,
    "website",
    "organic",
    "pageviews",
  );
  const websitePaidVisitors = getMetricValue(
    map,
    "website",
    "paid",
    "visitors",
  );
  const websiteOrganicVisitors = getMetricValue(
    map,
    "website",
    "organic",
    "visitors",
  );
  const metaClicks = facebookPaidClicks + instagramPaidClicks;

  const total =
    coldCalls +
    xImpressions +
    metaClicks +
    facebookOrganicReach +
    instagramOrganicReach +
    websitePaidPageviews +
    websiteOrganicPageviews;

  return {
    date,
    coldCalls,
    xImpressions,
    metaClicks,
    facebookPaidClicks,
    instagramPaidClicks,
    facebookOrganicReach,
    instagramOrganicReach,
    websitePaidPageviews,
    websiteOrganicPageviews,
    websitePaidVisitors,
    websiteOrganicVisitors,
    total,
  };
}

export function aggregateRowsToTotals(rows: RawMetricRow[]): ReachTotals {
  const map = buildMetricMap(rows);
  const day = rowsToReachDay("", map);
  const { date: _date, ...totals } = day;
  return totals;
}

export function buildReachDaysFromRows(rows: RawMetricRow[]): ReachDay[] {
  const byDate = new Map<string, RawMetricRow[]>();
  for (const row of rows) {
    const list = byDate.get(row.dateKey) ?? [];
    list.push(row);
    byDate.set(row.dateKey, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dateRows]) =>
      rowsToReachDay(dateKey, buildMetricMap(dateRows)),
    );
}

function sumLaneMetric(
  rows: RawMetricRow[],
  channel: ReachChannelId,
  trafficType: ReachTrafficType,
  metric: ReachMetricKind,
  dateFilter?: (dateKey: string) => boolean,
): number {
  return rows
    .filter(
      (r) =>
        r.channel === channel &&
        r.trafficType === trafficType &&
        r.metric === metric &&
        (!dateFilter || dateFilter(r.dateKey)),
    )
    .reduce((sum, r) => sum + r.value, 0);
}

function buildLaneTotals(
  rows: RawMetricRow[],
  channel: ReachChannelId,
  trafficType: ReachTrafficType,
  primaryMetric: ReachMetricKind,
  secondaryMetrics: ReachMetricKind[],
  todayKey: string,
  weekStartKey: string,
): ReachLaneMetricTotals {
  const isToday = (d: string) => d === todayKey;
  const isWeek = (d: string) => d >= weekStartKey;

  const primary: ReachLaneMetricTotals["primary"] = {
    today: sumLaneMetric(rows, channel, trafficType, primaryMetric, isToday),
    week: sumLaneMetric(rows, channel, trafficType, primaryMetric, isWeek),
    allTime: sumLaneMetric(rows, channel, trafficType, primaryMetric),
  };

  const secondary: ReachLaneMetricTotals["secondary"] = {};
  for (const metric of secondaryMetrics) {
    secondary[metric] = {
      today: sumLaneMetric(rows, channel, trafficType, metric, isToday),
      week: sumLaneMetric(rows, channel, trafficType, metric, isWeek),
      allTime: sumLaneMetric(rows, channel, trafficType, metric),
    };
  }

  return { primary, secondary };
}

export function buildChannelGroupData(
  rows: RawMetricRow[],
  channelId: ReachChannelId,
  todayKey: string,
  weekStartKey: string,
  series: ReachDay[],
): ReachChannelGroupData {
  const config = getChannelConfig(channelId);
  const channelRows = rows.filter((r) => r.channel === channelId);

  if (!config.lanes || config.lanes.length === 0) {
    const metric =
      channelId === "cold_calls"
        ? ("clicks" as const)
        : ("impressions" as const);
    const trafficType =
      channelId === "cold_calls" ? ("manual" as const) : ("organic" as const);
    const hero = buildLaneTotals(
      channelRows,
      channelId,
      trafficType,
      metric,
      [],
      todayKey,
      weekStartKey,
    );
    return {
      id: channelId,
      heroToday: hero.primary.today,
      heroWeek: hero.primary.week,
      paidToday: 0,
      organicToday: hero.primary.today,
      lanes: [
        {
          trafficType: "organic",
          metrics: hero,
          sparkline: series.map((d) => ({
            date: d.date,
            value:
              channelId === "cold_calls" ? d.coldCalls : d.xImpressions,
          })),
        },
      ],
    };
  }

  const lanes = config.lanes.map((lane) => {
    const metrics = buildLaneTotals(
      channelRows,
      channelId,
      lane.trafficType,
      lane.primaryMetric,
      lane.secondaryMetrics,
      todayKey,
      weekStartKey,
    );
    return {
      trafficType: lane.trafficType,
      metrics,
      sparkline: series.map((d) => ({
        date: d.date,
        value:
          d.date === ""
            ? 0
            : (() => {
                const day = series.find((s) => s.date === d.date);
                if (!day) return 0;
                if (channelId === "facebook") {
                  return lane.trafficType === "paid"
                    ? day.facebookPaidClicks
                    : day.facebookOrganicReach;
                }
                if (channelId === "instagram") {
                  return lane.trafficType === "paid"
                    ? day.instagramPaidClicks
                    : day.instagramOrganicReach;
                }
                if (channelId === "website") {
                  return lane.trafficType === "paid"
                    ? day.websitePaidPageviews
                    : day.websiteOrganicPageviews;
                }
                return 0;
              })(),
      })),
    };
  });

  const paidToday = lanes.find((l) => l.trafficType === "paid")?.metrics.primary
    .today ?? 0;
  const organicToday =
    lanes.find((l) => l.trafficType === "organic")?.metrics.primary.today ?? 0;

  return {
    id: channelId,
    heroToday: paidToday + organicToday,
    heroWeek:
      (lanes.find((l) => l.trafficType === "paid")?.metrics.primary.week ?? 0) +
      (lanes.find((l) => l.trafficType === "organic")?.metrics.primary.week ??
        0),
    paidToday,
    organicToday,
    lanes,
  };
}

export function buildAllChannelGroups(
  rows: RawMetricRow[],
  todayKey: string,
  weekStartKey: string,
): ReachChannelGroupData[] {
  const series = buildReachDaysFromRows(rows);
  return REACH_CHANNELS.map((ch) =>
    buildChannelGroupData(rows, ch.id, todayKey, weekStartKey, series),
  );
}

export { EMPTY_TOTALS };
