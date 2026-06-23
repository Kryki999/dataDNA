import { STAT_LABEL, STAT_VALUE } from "@/lib/ui-patterns";

type ProfileStatsRowProps = {
  totalReach: number;
  coldCalls: number;
  longestStreak: number;
  currentStreak: number;
};

function formatReach(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function ProfileStatsRow({
  totalReach,
  coldCalls,
  longestStreak,
  currentStreak,
}: ProfileStatsRowProps) {
  const stats = [
    { label: "Łączne zasięgi", value: formatReach(totalReach) },
    { label: "Zimne telefony", value: coldCalls.toString() },
    { label: "Najdłuższa seria", value: `${longestStreak} dni` },
    {
      label: "Aktualna seria",
      value: `${currentStreak} dni`,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className={STAT_LABEL}>{stat.label}</p>
          <p
            className={`${STAT_VALUE} ${stat.highlight ? "text-primary" : ""}`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
