"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { removeProfileAvatar, uploadProfileAvatar } from "@/lib/actions/avatar";
import { validateAvatarFile } from "@/lib/avatar";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [profilePublic, setProfilePublic] = useState(profile.profilePublic);
  const [isPending, startTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
    setProfilePublic(profile.profilePublic);
  }, [open, profile]);

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const formData = new FormData();
    formData.set("avatar", file);

    startAvatarTransition(async () => {
      try {
        const result = await uploadProfileAvatar(formData);
        setAvatarUrl(result.url);
        toast.success("Zdjęcie profilowe zaktualizowane");
        onSaved();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nie udało się przesłać zdjęcia",
        );
      }
    });
  }

  function handleRemoveAvatar() {
    startAvatarTransition(async () => {
      try {
        await removeProfileAvatar();
        setAvatarUrl(null);
        toast.success("Zdjęcie profilowe usunięte");
        onSaved();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć zdjęcia",
        );
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProfile({
          displayName,
          username,
          bio,
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
      <SheetContent className="border-dna-border/40 bg-dna-surface">
        <SheetHeader>
          <SheetTitle>Edytuj profil</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <Label>Zdjęcie profilowe</Label>
            <div className="flex items-center gap-4">
              <Avatar className="size-16 rounded-lg">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAvatarPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isAvatarPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  {isAvatarPending ? "Przesyłanie…" : "Wybierz zdjęcie"}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isAvatarPending}
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 className="size-4" />
                    Usuń
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="user"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP lub GIF · max 2 MB · działa na telefonie i
              komputerze
            </p>
          </div>

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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profilePublic}
              onChange={(e) => setProfilePublic(e.target.checked)}
              className="rounded border-dna-border"
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
