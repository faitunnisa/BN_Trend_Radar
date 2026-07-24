import { ApiError, errorResponse } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildTrendPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("trend_votes")
      .upsert(
        { trend_id: id, user_id: user.id },
        { onConflict: "trend_id,user_id", ignoreDuplicates: true },
      );

    if (error) {
      if (error.code === "23503") {
        throw new ApiError(404, "Trend tidak ditemukan.");
      }
      throw error;
    }

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("trend_votes")
      .delete()
      .eq("trend_id", id)
      .eq("user_id", user.id);

    if (error) throw error;

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
