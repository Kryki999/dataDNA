"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link2, Pencil } from "lucide-react";

type ProfileHeaderProps = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  onShare: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
};

export function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  onShare,
  onEdit,
  readOnly = false,
}: ProfileHeaderProps) {
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
          <p className="text-sm text-muted-foreground">@{username}</p>
          {bio ? (
            <p className="text-sm text-muted-foreground">{bio}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={onShare}>
          <Link2 className="size-4" />
          Share
        </Button>
        {!readOnly && onEdit ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : null}
      </div>
    </div>
  );
}
