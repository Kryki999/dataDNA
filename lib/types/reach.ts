export type ReachDay = {
  date: string;
  coldCalls: number;
  xImpressions: number;
  metaClicks: number;
  total: number;
};

export type ReachTotals = {
  coldCalls: number;
  xImpressions: number;
  metaClicks: number;
  total: number;
};

export type ReachSummary = {
  today: ReachTotals;
  week: ReachTotals;
  allTime: ReachTotals;
};
