import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { divisionSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"]);
    const { id } = await context.params;
    const parsed = divisionSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Nama division tidak valid.");
    }

    const { error } = await supabaseAdmin
      .from("divisions")
      .update({ name: parsed.data.name, is_active: true })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "Nama division sudah ada.");
      }
      throw error;
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"]);
    const { id } = await context.params;

    const { data: division, error: findError } = await supabaseAdmin
      .from("divisions")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!division) throw new ApiError(404, "Division tidak ditemukan.");
    if (division.name === "Unassigned") {
      throw new ApiError(400, "Division Unassigned tidak dapat dihapus.");
    }

    const { data: unassigned, error: unassignedError } =
      await supabaseAdmin
        .from("divisions")
        .select("id")
        .eq("name", "Unassigned")
        .single();

    if (unassignedError) throw unassignedError;

    const { error: moveError } = await supabaseAdmin
      .from("app_users")
      .update({ division_id: unassigned.id })
      .eq("division_id", id);

    if (moveError) throw moveError;

    const { error } = await supabaseAdmin
      .from("divisions")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
