"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flame, Phone, Radio, Target, TrendingUp } from "lucide-react";

type DnaStatsCardsProps = {
  streak: number;
  longestStreak: number;
  revenueTotal: number;
  revenueGoal: number;
  revenuePercent: number;
  callsToday: number;
  callsWeek: number;
  allTimeReach: number;
};

export function DnaStatsCards({
  streak,
  longestStreak,
  revenueTotal,
  revenueGoal,
  revenuePercent,
  callsToday,
  callsWeek,
  allTimeReach,
}: DnaStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:border-border/80 *:data-[slot=card]:bg-card/80 *:data-[slot=card]:shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)] lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Streak outreachu</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-[oklch(0.78_0.19_155)] @[250px]/card:text-3xl">
            {streak} dni
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Flame />
              {longestStreak} rekord
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Nie przerwij łańcucha <Flame className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">The Wall — ciągłość akcji</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cel przychodu</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {revenueTotal.toLocaleString("pl-PL")} PLN
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              {revenuePercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Cel: {revenueGoal.toLocaleString("pl-PL")} PLN
            <Target className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {Math.max(0, revenueGoal - revenueTotal).toLocaleString("pl-PL")} PLN
            do celu
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Telefony dziś</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-[oklch(0.78_0.19_155)] @[250px]/card:text-3xl">
            {callsToday}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Phone />
              tydzień {callsWeek}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Log Call — jeden klik
          </div>
          <div className="text-muted-foreground">Bez formularzy, instant +1</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Zasięgi all-time</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-[oklch(0.82_0.14_155)] @[250px]/card:text-3xl">
            {allTimeReach.toLocaleString("pl-PL")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[oklch(0.72_0.16_220/0.4)] text-[oklch(0.72_0.16_220)]">
              <Radio />
              skumulowane
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Calls + X + Meta od dnia 1
          </div>
          <div className="text-muted-foreground">Historyczna suma absolutna</div>
        </CardFooter>
      </Card>
    </div>
  );
}
