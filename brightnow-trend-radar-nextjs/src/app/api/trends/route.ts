import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildTrendPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { trendCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const parsed = trendCreateSchema.safeParse(
      await parseJson<unknown>(request),
    );
    if (!parsed.success) {
      throw new ApiError(400, "Form trend belum lengkap atau tidak valid.");
    }

    const input = parsed.data;
    const { data: trend, error } = await supabaseAdmin
      .from("trends")
      .insert({
        submission_week: input.submissionWeek,
        title: input.title,
        category: input.category,
        platform: input.platform,
        momentum: input.momentum,
        source_url: input.sourceUrl || null,
        evidence_description: input.evidenceDescription || null,
        relevance: input.relevance,
        suggested_action: input.suggestedAction || null,
        board_status: input.boardStatus,
        submitted_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { error: historyError } = await supabaseAdmin
      .from("trend_status_history")
      .insert({
        trend_id: trend.id,
        previous_status: null,
        new_status: input.boardStatus,
        changed_by: user.id,
      });

    if (historyError) throw historyError;

    await queueSheetSync(
      "trend",
      trend.id,
      await buildTrendPayload(trend.id),
    );

    return Response.json({ id: trend.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
