import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildTrendPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { trendStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const body = await parseJson<{ status?: unknown }>(request);
    const status = trendStatusSchema.safeParse(body.status);

    if (!status.success) {
      throw new ApiError(400, "Status trend tidak valid.");
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from("trends")
      .select("board_status")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) throw new ApiError(404, "Trend tidak ditemukan.");
    if (existing.board_status === status.data) {
      return Response.json({ ok: true });
    }

    const { error: updateError } = await supabaseAdmin
      .from("trends")
      .update({ board_status: status.data })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: historyError } = await supabaseAdmin
      .from("trend_status_history")
      .insert({
        trend_id: id,
        previous_status: existing.board_status,
        new_status: status.data,
        changed_by: user.id,
      });

    if (historyError) throw historyError;

    await queueSheetSync(
      "trend",
      id,
      await buildTrendPayload(id),
    );

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
