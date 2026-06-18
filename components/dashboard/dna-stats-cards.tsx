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
import { Flame, Phone, Target, TrendingUp } from "lucide-react";

type DnaStatsCardsProps = {
  streak: number;
  longestStreak: number;
  revenueTotal: number;
  revenueGoal: number;
  revenuePercent: number;
  callsToday: number;
  callsWeek: number;
};

export function DnaStatsCards({
  streak,
  longestStreak,
  revenueTotal,
  revenueGoal,
  revenuePercent,
  callsToday,
  callsWeek,
}: DnaStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Streak outreachu</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {streak} dni
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Flame />
              {longestStreak} rekord
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Nie przerwij łańcucha <Flame className="size-4" />
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {callsToday}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Phone />
              tydzień {callsWeek}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Cold calling dzisiaj
          </div>
          <div className="text-muted-foreground">Ręczne logowanie w Zasięgach</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Postęp celu</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {revenuePercent}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Przychód
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pipeline revenue
          </div>
          <div className="text-muted-foreground">
            Zamknięte deale w tym okresie
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
