"use server";

import { del, put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  avatarExtension,
  isVercelBlobUrl,
  validateAvatarFile,
} from "@/lib/avatar";
import { getCurrentOrganizationId, getCurrentUserId } from "@/lib/tenant";
import { revalidateDashboard, revalidatePublicProfile } from "@/lib/revalidate";

async function getCurrentUserProfile() {
  const organizationId = await getCurrentOrganizationId();
  const userId = await getCurrentUserId();

  const [user] = await db
    .select({
      avatarUrl: users.avatarUrl,
      username: users.username,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  return { organizationId, userId, user };
}

async function deleteStoredAvatar(url: string | null) {
  if (!url || !isVercelBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // Ignore missing blobs from earlier deployments.
  }
}

export async function uploadProfileAvatar(formData: FormData) {
  const { organizationId, userId, user } = await getCurrentUserProfile();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Nie wybrano pliku");
  }

  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const pathname = `avatars/${userId}/${Date.now()}.${avatarExtension(file)}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  await db
    .update(users)
    .set({ avatarUrl: blob.url })
    .where(
      and(eq(users.id, userId), eq(users.organizationId, organizationId)),
    );

  await deleteStoredAvatar(user.avatarUrl);

  revalidateDashboard();
  if (user.username) revalidatePublicProfile(user.username);

  return { url: blob.url };
}

export async function removeProfileAvatar() {
  const { organizationId, userId, user } = await getCurrentUserProfile();

  await db
    .update(users)
    .set({ avatarUrl: null })
    .where(
      and(eq(users.id, userId), eq(users.organizationId, organizationId)),
    );

  await deleteStoredAvatar(user.avatarUrl);

  revalidateDashboard();
  if (user.username) revalidatePublicProfile(user.username);

  return { url: null };
}
