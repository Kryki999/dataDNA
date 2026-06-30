"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, X } from "lucide-react";
import { ChannelReachForm } from "@/components/analytics/ChannelReachForm";
import { LogCallButton } from "@/components/analytics/LogCallButton";
import { ReachDualSparkline } from "@/components/analytics/ReachDualSparkline";
import { ReachChannelSparkline } from "@/components/analytics/ReachChannelSparkline";
import { ReachIntegrationPanel } from "@/components/analytics/ReachIntegrationPanel";
import { ReachTrafficLane } from "@/components/analytics/ReachTrafficLane";
import {
  buildChannelSparkline,
  findChannelData,
  getChannelHeroToday,
  getChannelTrend,
  getChannelValue,
  REACH_CHANNELS,
  type ReachChannelConfig,
} from "@/lib/reach-channels";
import type { IntegrationView } from "@/lib/actions/integrations";
import type { ReachChannelId, ReachDay, ReachSummary } from "@/lib/types/reach";
import { SURFACE_CARD, SURFACE_OVERLAY, EYEBROW, SURFACE_WELL } from "@/lib/ui-patterns";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

type ReachChannelGridProps = {
  summary: ReachSummary;
  series: ReachDay[];
  streak: number;
  integrations: IntegrationView[];
  onOptimisticCallLog?: () => void;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.227-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
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
  if (channel.customIcon === "x") return <XIcon className={className} />;
  if (channel.customIcon === "facebook") return <FacebookIcon className={className} />;
  if (channel.customIcon === "instagram") return <InstagramIcon className={className} />;
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

function StatusBadge({
  channel,
  integrations,
}: {
  channel: ReachChannelConfig;
  integrations: IntegrationView[];
}) {
  if (channel.inputMode === "manual") {
    return (
      <span className="rounded-full border border-dna-border/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Ręcznie
      </span>
    );
  }

  const provider =
    channel.id === "website"
      ? "vercel-analytics"
      : channel.id === "facebook" || channel.id === "instagram"
        ? "meta"
        : null;

  const integration = integrations.find((i) => i.provider === provider);

  if (integration?.status === "connected" && integration.lastSyncAt) {
    const hoursSince =
      (Date.now() - new Date(integration.lastSyncAt).getTime()) / 3_600_000;
    if (hoursSince < 24) {
      return (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
          style={{
            color: channel.color,
            backgroundColor: `${channel.color}18`,
            boxShadow: `0 0 12px ${channel.glowColor}`,
          }}
        >
          Live
        </span>
      );
    }
  }

  if (channel.inputMode === "hybrid") {
    return (
      <span className="rounded-full border border-dna-border/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Ręcznie
      </span>
    );
  }

  return (
    <span className="rounded-full border border-dashed border-dna-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      Połącz
    </span>
  );
}

function getIntegrationForChannel(
  channel: ReachChannelConfig,
  integrations: IntegrationView[],
) {
  const provider =
    channel.id === "website"
      ? "vercel-analytics"
      : channel.id === "facebook" || channel.id === "instagram"
        ? "meta"
        : null;
  return integrations.find((i) => i.provider === provider);
}

function isChannelConnected(
  channel: ReachChannelConfig,
  integrations: IntegrationView[],
) {
  if (channel.inputMode === "manual") return true;
  const integration = getIntegrationForChannel(channel, integrations);
  return integration?.status === "connected";
}

type ChannelCardContentProps = {
  channel: ReachChannelConfig;
  summary: ReachSummary;
  series: ReachDay[];
  integrations: IntegrationView[];
  expanded?: boolean;
  streak?: number;
  onOptimisticCallLog?: () => void;
  onClose?: () => void;
};

function ChannelCardContent({
  channel,
  summary,
  series,
  integrations,
  expanded = false,
  streak = 0,
  onOptimisticCallLog,
  onClose,
}: ChannelCardContentProps) {
  const channelData = findChannelData(summary, channel.id);
  const trend = getChannelTrend(series, channel.id);
  const today = getChannelHeroToday(channelData, channel);
  const week = getChannelValue(summary.week, channel.id);
  const connected = isChannelConnected(channel, integrations);
  const integration = getIntegrationForChannel(channel, integrations);

  const paidSparkline = buildChannelSparkline(series, channel.id, "paid", expanded ? 30 : 14);
  const organicSparkline = buildChannelSparkline(series, channel.id, "organic", expanded ? 30 : 14);
  const singleSparkline = buildChannelSparkline(series, channel.id, undefined, expanded ? 30 : 14);

  const hasDualLanes =
    channel.lanes && channel.lanes.length > 1 && channel.inputMode !== "manual";

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
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <StatusBadge channel={channel} integrations={integrations} />
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
      </div>

      {!expanded && hasDualLanes && channelData && (
        <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
          paid {channelData.paidToday.toLocaleString("pl-PL")} · org{" "}
          {channelData.organicToday.toLocaleString("pl-PL")}
        </p>
      )}

      <div className={cn("flex-1", expanded ? "my-6" : "my-4")}>
        {hasDualLanes ? (
          <ReachDualSparkline
            paidData={paidSparkline}
            organicData={organicSparkline}
            paidColor={channel.color}
            organicColor={channel.organicColor ?? channel.color}
            height={expanded ? 100 : 64}
          />
        ) : (
          <ReachChannelSparkline
            data={singleSparkline}
            color={channel.color}
            height={expanded ? 140 : 64}
            showBars={!expanded}
          />
        )}
      </div>

      {expanded ? (
        <div className="space-y-6 border-t border-dna-border pt-6">
          {hasDualLanes && channel.lanes ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="flex flex-col gap-6 md:flex-row md:gap-0 md:divide-x md:divide-dna-border/40"
            >
              {channel.lanes.map((laneConfig) => {
                const laneData = channelData?.lanes.find(
                  (l) => l.trafficType === laneConfig.trafficType,
                );
                return (
                  <div key={laneConfig.trafficType} className="md:px-4 md:first:pl-0 md:last:pr-0">
                    <ReachTrafficLane
                      channel={channel}
                      laneConfig={laneConfig}
                      laneData={laneData}
                      connected={connected}
                    />
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Dziś", value: today },
                { label: "Tydzień", value: week },
                {
                  label: "Łącznie",
                  value: getChannelValue(summary.allTime, channel.id),
                },
              ].map((stat) => (
                <div key={stat.label} className={cn(SURFACE_WELL, "px-3 py-2.5")}>
                  <p className={EYEBROW}>{stat.label}</p>
                  <p
                    className="mt-1 font-mono text-lg font-semibold tabular-nums"
                    style={{ color: channel.color }}
                  >
                    {stat.value.toLocaleString("pl-PL")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {integration?.lastSyncAt && channel.inputMode === "api" && (
            <p className="text-xs text-muted-foreground">
              Ostatni sync:{" "}
              {formatDistanceToNow(new Date(integration.lastSyncAt), {
                addSuffix: true,
                locale: pl,
              })}
            </p>
          )}

          {channel.id === "cold_calls" && (
            <div className="space-y-3">
              <p className={EYEBROW}>Szybki log</p>
              <LogCallButton
                callsToday={today}
                streak={streak}
                onOptimisticLog={onOptimisticCallLog}
                compact
              />
            </div>
          )}

          {(channel.inputMode === "manual" || channel.inputMode === "hybrid") && (
            <div className="space-y-3">
              <p className={EYEBROW}>
                {channel.id === "cold_calls" ? "Zbiorczy wpis" : "Dodaj dane"}
              </p>
              <ChannelReachForm channel={channel} />
            </div>
          )}

          {(channel.inputMode === "api" || channel.inputMode === "hybrid") && (
            <ReachIntegrationPanel
              channel={channel}
              integration={integration}
            />
          )}
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
  integrations,
  onOptimisticCallLog,
}: ReachChannelGridProps) {
  const [selectedId, setSelectedId] = useState<ReachChannelId | null>(null);
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
  const isApiModal = selectedChannel?.inputMode === "api";

  return (
    <LayoutGroup id="reach-channels">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className={EYEBROW}>Kanały</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kliknij kartę, aby zobaczyć szczegóły i połączyć źródła API
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
                  integrations={integrations}
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
                  "pointer-events-auto w-full overflow-y-auto bg-dna-surface p-6",
                  "max-h-[calc(100vh-2rem)]",
                  isApiModal ? "max-w-2xl" : "max-w-lg",
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
                  integrations={integrations}
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
