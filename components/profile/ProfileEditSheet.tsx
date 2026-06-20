"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";

type ProfileEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    displayName: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
    profilePublic: boolean;
  };
  onSaved: () => void;
};

export function ProfileEditSheet({
  open,
  onOpenChange,
  profile,
  onSaved,
}: ProfileEditSheetProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [profilePublic, setProfilePublic] = useState(profile.profilePublic);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProfile({
          displayName,
          username,
          bio,
          avatarUrl: avatarUrl || null,
          profilePublic,
        });
        toast.success("Profil zaktualizowany");
        onOpenChange(false);
        onSaved();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się zapisać",
        );
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-zinc-800 bg-zinc-950">
        <SheetHeader>
          <SheetTitle>Edytuj profil</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Wyświetlana nazwa</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profilePublic}
              onChange={(e) => setProfilePublic(e.target.checked)}
              className="rounded border-zinc-700"
            />
            Profil publiczny
          </label>
          <Button onClick={handleSave} disabled={isPending} className="w-full">
            {isPending ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
