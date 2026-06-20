"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStatsRow } from "@/components/profile/ProfileStatsRow";
import { ActivityHeatmap } from "@/components/wall/ActivityHeatmap";
import { ProfileActivityChart } from "@/components/profile/ProfileActivityChart";
import { ProfileActivityLog } from "@/components/profile/ProfileActivityLog";
import { ProfileEditSheet } from "@/components/profile/ProfileEditSheet";
import type { ActivityLogEntry } from "@/lib/actions/profile";

export type ProfileViewData = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  profilePublic: boolean;
  stats: {
    totalReach: number;
    coldCalls: number;
    currentStreak: number;
    longestStreak: number;
    activityCount: number;
  };
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  sparkline: Array<{ date: string; count: number }>;
  activityLog: ActivityLogEntry[];
};

type ProfileViewProps = {
  profile: ProfileViewData;
  readOnly?: boolean;
};

export function ProfileView({ profile, readOnly = false }: ProfileViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleShare() {
    const url = `${window.location.origin}/p/${profile.username}`;
    if (navigator.share) {
      void navigator.share({
        title: `${profile.displayName} — DataDNA`,
        url,
      });
      return;
    }
    void navigator.clipboard.writeText(url);
    toast.success("Link skopiowany");
  }

  return (
    <DashboardPage>
      <ProfileHeader
        displayName={profile.displayName}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        onShare={handleShare}
        onEdit={readOnly ? undefined : () => setEditOpen(true)}
        readOnly={readOnly}
      />

      <ProfileStatsRow
        totalReach={profile.stats.totalReach}
        coldCalls={profile.stats.coldCalls}
        longestStreak={profile.stats.longestStreak}
        currentStreak={profile.stats.currentStreak}
      />

      <ActivityHeatmap days={profile.heatmap.days} variant="profile" />

      <ProfileActivityChart
        data={profile.sparkline}
        activityCount={profile.stats.activityCount}
      />

      <ProfileActivityLog entries={profile.activityLog} />

      {!readOnly && (
        <ProfileEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            displayName: profile.displayName,
            username: profile.username,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            profilePublic: profile.profilePublic,
          }}
          onSaved={() => {
            startTransition(() => {
              window.location.reload();
            });
          }}
        />
      )}
    </DashboardPage>
  );
}
