import {
  deleteAvatar,
  uploadAvatar,
} from "@/lib/avatar";
import { ApiError, errorResponse } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(400, "Pilih file foto terlebih dahulu.");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new ApiError(400, "Gunakan JPG, PNG, atau WebP.");
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(400, "Ukuran foto maksimal 2 MB.");
    }

    const { data: current, error: findError } = await supabaseAdmin
      .from("app_users")
      .select("photo_path")
      .eq("id", user.id)
      .single();

    if (findError) throw findError;

    const newPath = await uploadAvatar(user.id, file);

    const { error: updateError } = await supabaseAdmin
      .from("app_users")
      .update({ photo_path: newPath })
      .eq("id", user.id);

    if (updateError) {
      await deleteAvatar(newPath);
      throw updateError;
    }

    await deleteAvatar(current.photo_path);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireSession();

    const { data: current, error: findError } = await supabaseAdmin
      .from("app_users")
      .select("photo_path")
      .eq("id", user.id)
      .single();

    if (findError) throw findError;

    const { error: updateError } = await supabaseAdmin
      .from("app_users")
      .update({ photo_path: null })
      .eq("id", user.id);

    if (updateError) throw updateError;
    await deleteAvatar(current.photo_path);

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
