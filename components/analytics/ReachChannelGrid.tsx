"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, X } from "lucide-react";
import { ChannelReachForm } from "@/components/analytics/ChannelReachForm";
import { LogCallButton } from "@/components/analytics/LogCallButton";
import { ReachChannelSparkline } from "@/components/analytics/ReachChannelSparkline";
import {
  buildChannelSparkline,
  getChannelTrend,
  getChannelValue,
  REACH_CHANNELS,
  type ReachChannelConfig,
  type ReachChannelKey,
} from "@/lib/reach-channels";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";
import { SURFACE_CARD, SURFACE_OVERLAY, EYEBROW, SURFACE_WELL } from "@/lib/ui-patterns";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type ReachChannelGridProps = {
  summary: ReachSummary;
  series: ReachDay[];
  streak: number;
  onOptimisticCallLog?: () => void;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ChannelIcon({
  channel,
  className,
}: {
  channel: ReachChannelConfig;
  className?: string;
}) {
  if (channel.customIcon === "x") {
    return <XIcon className={className} />;
  }
  const Icon = channel.icon;
  return <Icon className={className} />;
}

function TrendBadge({ trend }: { trend: ReturnType<typeof getChannelTrend> }) {
  if (trend.direction === "flat") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
        0%
      </span>
    );
  }

  const isUp = trend.direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        isUp ? "text-emerald-400" : "text-rose-400",
      )}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {trend.percent}%
    </span>
  );
}

type ChannelCardContentProps = {
  channel: ReachChannelConfig;
  summary: ReachSummary;
  series: ReachDay[];
  expanded?: boolean;
  streak?: number;
  onOptimisticCallLog?: () => void;
  onClose?: () => void;
};

function ChannelCardContent({
  channel,
  summary,
  series,
  expanded = false,
  streak = 0,
  onOptimisticCallLog,
  onClose,
}: ChannelCardContentProps) {
  const sparkline = buildChannelSparkline(series, channel.id, expanded ? 30 : 14);
  const trend = getChannelTrend(series, channel.id);
  const today = getChannelValue(summary.today, channel.id);
  const week = getChannelValue(summary.week, channel.id);
  const allTime = getChannelValue(summary.allTime, channel.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-dna-inset"
            style={{ color: channel.color }}
          >
            <ChannelIcon channel={channel} className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight text-foreground">
              {channel.label}
            </h3>
            {!expanded && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {today.toLocaleString("pl-PL")} dziś ·{" "}
                {week.toLocaleString("pl-PL")} tydz.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendBadge trend={trend} />
          {expanded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md bg-dna-inset text-muted-foreground transition-colors hover:bg-dna-inset/80 hover:text-foreground"
              aria-label="Zamknij"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className={cn("flex-1", expanded ? "my-6" : "my-4")}>
        <ReachChannelSparkline
          data={sparkline}
          color={channel.color}
          height={expanded ? 140 : 64}
          showBars={!expanded}
        />
      </div>

      {expanded ? (
        <div className="space-y-6 border-t border-dna-border pt-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Dziś", value: today },
              { label: "Tydzień", value: week },
              { label: "Łącznie", value: allTime },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(SURFACE_WELL, "px-3 py-2.5")}
              >
                <p className={EYEBROW}>
                  {stat.label}
                </p>
                <p
                  className="mt-1 font-mono text-lg font-semibold tabular-nums"
                  style={{ color: channel.color }}
                >
                  {stat.value.toLocaleString("pl-PL")}
                </p>
              </div>
            ))}
          </div>

          {channel.id === "coldCalls" && (
            <div className="space-y-3">
              <p className={EYEBROW}>
                Szybki log
              </p>
              <LogCallButton
                callsToday={today}
                streak={streak}
                onOptimisticLog={onOptimisticCallLog}
                compact
              />
            </div>
          )}

          <div className="space-y-3">
            <p className={EYEBROW}>
              {channel.id === "coldCalls" ? "Zbiorczy wpis" : "Dodaj dane"}
            </p>
            <ChannelReachForm channel={channel} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-medium tabular-nums text-foreground">
            {today.toLocaleString("pl-PL")}
          </span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">
            {week.toLocaleString("pl-PL")} w tym tygodniu
          </span>
        </p>
      )}
    </div>
  );
}

export function ReachChannelGrid({
  summary,
  series,
  streak,
  onOptimisticCallLog,
}: ReachChannelGridProps) {
  const [selectedId, setSelectedId] = useState<ReachChannelKey | null>(null);

  const reducedMotion = useReducedMotion();

  const close = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    if (!selectedId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, close]);

  const selectedChannel = REACH_CHANNELS.find((ch) => ch.id === selectedId);

  return (
    <LayoutGroup id="reach-channels">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className={EYEBROW}>Kanały</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kliknij kartę, aby zobaczyć szczegóły i dodać dane
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REACH_CHANNELS.map((channel) => {
            const isSelected = selectedId === channel.id;
            if (isSelected) {
              return <div key={channel.id} className="invisible" aria-hidden />;
            }

            return (
              <motion.button
                key={channel.id}
                type="button"
                layoutId={`reach-channel-${channel.id}`}
                onClick={() => setSelectedId(channel.id)}
                className={cn(
                  SURFACE_CARD,
                  "group cursor-pointer p-4 text-left transition-colors",
                  "hover:brightness-105",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dna-border",
                )}
                style={{
                  boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.03)`,
                }}
                whileHover={reducedMotion ? undefined : { scale: 1.01 }}
                whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 30 }
                }
              >
                <ChannelCardContent
                  channel={channel}
                  summary={summary}
                  series={series}
                />
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {selectedId && selectedChannel && (
          <>
            <motion.div
              key="backdrop"
              className={cn("fixed inset-0 z-40", SURFACE_OVERLAY)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              onClick={close}
              aria-hidden
            />

            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                key={`expanded-${selectedId}`}
                layoutId={`reach-channel-${selectedId}`}
                className={cn(
                  SURFACE_CARD,
                  "pointer-events-auto w-full max-w-lg overflow-y-auto bg-dna-surface p-6",
                  "max-h-[calc(100vh-2rem)]",
                )}
                style={{
                  boxShadow: `0 0 60px ${selectedChannel.glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.05)`,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 350, damping: 32 }
                }
                onClick={(event) => event.stopPropagation()}
              >
                <ChannelCardContent
                  channel={selectedChannel}
                  summary={summary}
                  series={series}
                  expanded
                  streak={streak}
                  onOptimisticCallLog={onOptimisticCallLog}
                  onClose={close}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
