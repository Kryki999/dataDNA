export type ReachChannelId =
  | "cold_calls"
  | "x"
  | "facebook"
  | "instagram"
  | "website";

export type ReachTrafficType = "manual" | "paid" | "organic";

export type ReachMetricKind =
  | "clicks"
  | "impressions"
  | "reach"
  | "pageviews"
  | "visitors";

export type ReachMetricKey = {
  channel: ReachChannelId;
  trafficType: ReachTrafficType;
  metric: ReachMetricKind;
};

export type ReachLaneTotals = {
  today: number;
  week: number;
  allTime: number;
};

export type ReachLaneMetricTotals = {
  primary: ReachLaneTotals;
  secondary: Partial<Record<ReachMetricKind, ReachLaneTotals>>;
};

export type ReachChannelLaneData = {
  trafficType: "paid" | "organic";
  metrics: ReachLaneMetricTotals;
  sparkline: { date: string; value: number }[];
};

export type ReachChannelGroupData = {
  id: ReachChannelId;
  heroToday: number;
  heroWeek: number;
  paidToday: number;
  organicToday: number;
  lanes: ReachChannelLaneData[];
};

/** Legacy flat day shape + grouped channels */
export type ReachDay = {
  date: string;
  coldCalls: number;
  xImpressions: number;
  metaClicks: number;
  facebookPaidClicks: number;
  instagramPaidClicks: number;
  facebookOrganicReach: number;
  instagramOrganicReach: number;
  websitePaidPageviews: number;
  websiteOrganicPageviews: number;
  websitePaidVisitors: number;
  websiteOrganicVisitors: number;
  total: number;
};

export type ReachTotals = {
  coldCalls: number;
  xImpressions: number;
  metaClicks: number;
  facebookPaidClicks: number;
  instagramPaidClicks: number;
  facebookOrganicReach: number;
  instagramOrganicReach: number;
  websitePaidPageviews: number;
  websiteOrganicPageviews: number;
  websitePaidVisitors: number;
  websiteOrganicVisitors: number;
  total: number;
};

export type ReachSummary = {
  today: ReachTotals;
  week: ReachTotals;
  allTime: ReachTotals;
  channels: ReachChannelGroupData[];
};

export type IntegrationStatusView = {
  provider: string;
  status: "disconnected" | "connected" | "error";
  lastSyncAt: Date | null;
  errorMessage?: string;
};
