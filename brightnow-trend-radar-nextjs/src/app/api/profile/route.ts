import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { profileUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    const user = await requireSession();
    const parsed = profileUpdateSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Nama profil tidak valid.");
    }

    const { error } = await supabaseAdmin
      .from("app_users")
      .update({ display_name: parsed.data.displayName })
      .eq("id", user.id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
