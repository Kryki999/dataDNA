import { getProfile } from "@/lib/actions/profile";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function ProfilPage() {
  const profile = await getProfile();

  return (
    <ProfileView
      profile={{
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        profilePublic: profile.profilePublic,
        stats: profile.stats,
        heatmap: profile.heatmap,
        sparkline: profile.sparkline,
        activityLog: profile.activityLog,
      }}
    />
  );
}
