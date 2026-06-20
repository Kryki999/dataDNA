import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Dna } from "lucide-react";
import { getPublicProfile } from "@/lib/actions/profile";
import { ProfileView } from "@/components/profile/ProfileView";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) {
    return { title: "Profil — DataDNA" };
  }
  return {
    title: `${profile.displayName} (@${profile.username}) — DataDNA`,
    description: `Streak: ${profile.stats.currentStreak}d · ${profile.stats.totalReach} zasięgów`,
    openGraph: {
      title: `${profile.displayName} — DataDNA`,
      description: `Current streak: ${profile.stats.currentStreak} days`,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dna className="size-3.5" />
          </div>
          DataDNA
        </Link>
      </header>
      <ProfileView
        readOnly
        profile={{
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          profilePublic: true,
          stats: profile.stats,
          heatmap: profile.heatmap,
          sparkline: profile.sparkline,
          activityLog: profile.activityLog,
        }}
      />
    </div>
  );
}
