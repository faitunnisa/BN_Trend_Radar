import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { divisionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const parsed = divisionSchema.safeParse(
      await parseJson<unknown>(request),
    );
    if (!parsed.success) {
      throw new ApiError(400, "Nama division tidak valid.");
    }

    const { data, error } = await supabaseAdmin
      .from("divisions")
      .insert({ name: parsed.data.name, is_active: true })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "Nama division sudah ada.");
      }
      throw error;
    }

    return Response.json({ id: data.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
