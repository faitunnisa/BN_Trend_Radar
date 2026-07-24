import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "avatars";

export async function getAvatarUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.warn("Unable to create signed avatar URL:", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function deleteAvatar(path: string | null): Promise<void> {
  if (!path) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Unable to delete old avatar:", error.message);
}
