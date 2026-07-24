import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildActionPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { actionInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const parsed = actionInputSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Form action belum lengkap atau tidak valid.");
    }

    const input = parsed.data;
    const { data: action, error } = await supabaseAdmin
      .from("actions")
      .insert({
        start_date: input.startDate,
        end_date: input.endDate,
        source_trend_id: input.sourceTrendId || null,
        title: input.title,
        accountable_user_id: input.accountableUserId,
        status: input.status,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    await queueSheetSync(
      "action",
      action.id,
      await buildActionPayload(action.id),
    );

    return Response.json({ id: action.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
