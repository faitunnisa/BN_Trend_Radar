import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { verifyPin } from "@/lib/pin";
import { createSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { selectProfileSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = selectProfileSchema.safeParse(
      await parseJson<unknown>(request),
    );
    if (!parsed.success) {
      throw new ApiError(400, "Profil atau PIN tidak valid.");
    }

    const { data: user, error } = await supabaseAdmin
      .from("app_users")
      .select("id,role,pin_hash,is_active")
      .eq("id", parsed.data.userId)
      .maybeSingle();

    if (error) throw error;
    if (!user || !user.is_active) {
      throw new ApiError(404, "Profil tidak ditemukan atau sudah nonaktif.");
    }

    if (user.role !== "contributor") {
      if (!parsed.data.pin || !verifyPin(parsed.data.pin, user.pin_hash)) {
        throw new ApiError(401, "PIN salah.");
      }
    }

    const sessionUser = await createSession(user.id);
    return Response.json({ user: sessionUser });
  } catch (error) {
    return errorResponse(error);
  }
}
