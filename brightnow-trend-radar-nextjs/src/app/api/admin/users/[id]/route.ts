import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { hashPin } from "@/lib/pin";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { userUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"]);
    const { id } = await context.params;
    const parsed = userUpdateSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Data team member tidak valid.");
    }

    const input = parsed.data;
    const { data: existing, error: findError } = await supabaseAdmin
      .from("app_users")
      .select("pin_hash")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) throw new ApiError(404, "User tidak ditemukan.");

    let pinHash: string | null = existing.pin_hash;
    if (input.role === "contributor") {
      pinHash = null;
    } else if (input.pin) {
      pinHash = hashPin(input.pin);
    } else if (!pinHash) {
      throw new ApiError(
        400,
        "Admin dan Curator wajib memiliki PIN 4 digit.",
      );
    }

    const { error } = await supabaseAdmin
      .from("app_users")
      .update({
        display_name: input.displayName,
        division_id: input.divisionId,
        role: input.role,
        pin_hash: pinHash,
        is_active: input.isActive,
      })
      .eq("id", id);

    if (error) throw error;
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
    const admin = await requireRole(["admin"]);
    const { id } = await context.params;

    if (id === admin.id) {
      throw new ApiError(
        400,
        "Master Admin yang sedang aktif tidak dapat menonaktifkan dirinya sendiri.",
      );
    }

    const { error } = await supabaseAdmin
      .from("app_users")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
