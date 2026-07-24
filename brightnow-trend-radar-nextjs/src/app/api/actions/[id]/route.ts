import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireRole, requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildActionPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { actionInputSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const parsed = actionInputSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Form action tidak valid.");
    }

    const input = parsed.data;
    const { data: existing, error: findError } = await supabaseAdmin
      .from("actions")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) throw new ApiError(404, "Action tidak ditemukan.");
    if (existing.status === "done") {
      throw new ApiError(
        400,
        "Action yang sudah Done tidak dapat diedit dari form biasa.",
      );
    }

    const { error } = await supabaseAdmin
      .from("actions")
      .update({
        start_date: input.startDate,
        end_date: input.endDate,
        source_trend_id: input.sourceTrendId || null,
        title: input.title,
        accountable_user_id: input.accountableUserId,
        status: input.status,
        updated_by: user.id,
      })
      .eq("id", id);

    if (error) throw error;

    await queueSheetSync(
      "action",
      id,
      await buildActionPayload(id),
    );

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

    const { error } = await supabaseAdmin
      .from("actions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
