import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import {
  buildActionPayload,
  buildLearningPayload,
} from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { learningSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const parsed = learningSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Learning title, result, dan reusable principle wajib diisi.",
      );
    }

    const input = parsed.data;
    const { data: learningId, error } = await supabaseAdmin.rpc(
      "complete_action_with_learning",
      {
        p_action_id: id,
        p_user_id: user.id,
        p_title: input.title,
        p_result_kpi: input.resultKpi,
        p_what_worked: input.whatWorked || "",
        p_what_didnt_work: input.whatDidntWork || "",
        p_why_it_happened: input.whyItHappened || "",
        p_reusable_principle: input.reusablePrinciple,
        p_evidence_url: input.evidenceUrl || "",
      },
    );

    if (error) {
      if (error.message.includes("ONLY_ACTION_OWNER_CAN_COMPLETE")) {
        throw new ApiError(
          403,
          "Hanya Action Owner yang bisa menyelesaikan action ini.",
        );
      }
      if (error.message.includes("LEARNING_ALREADY_EXISTS")) {
        throw new ApiError(409, "Learning untuk action ini sudah terbit.");
      }
      if (error.message.includes("ACTION_NOT_FOUND")) {
        throw new ApiError(404, "Action tidak ditemukan.");
      }
      throw error;
    }

    await Promise.all([
      queueSheetSync(
        "action",
        id,
        await buildActionPayload(id),
      ),
      queueSheetSync(
        "learning",
        String(learningId),
        await buildLearningPayload(String(learningId)),
      ),
    ]);

    return Response.json({ learningId });
  } catch (error) {
    return errorResponse(error);
  }
}
