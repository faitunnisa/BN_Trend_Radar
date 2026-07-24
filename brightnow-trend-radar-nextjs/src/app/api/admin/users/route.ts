import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { hashPin } from "@/lib/pin";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { userCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const parsed = userCreateSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Data team member tidak valid.");
    }

    const input = parsed.data;
    if (input.role !== "contributor" && !input.pin) {
      throw new ApiError(
        400,
        "Admin dan Curator wajib memiliki PIN 4 digit.",
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_users")
      .insert({
        display_name: input.displayName,
        division_id: input.divisionId,
        role: input.role,
        pin_hash:
          input.role === "contributor"
            ? null
            : hashPin(input.pin as string),
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "Nama user sudah terdaftar.");
      }
      throw error;
    }

    return Response.json({ id: data.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
