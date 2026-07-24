import { ApiError, errorResponse, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { queueSheetSync } from "@/lib/sheet-sync";
import { buildTrendPayload } from "@/lib/sync-payloads";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scoreSchema } from "@/lib/validation";

function calculateScore(input: {
  momentum: number;
  genZRelevance: number;
  brightNowRelevance: number;
  adaptability: number;
  speedRequired: number;
  businessPotential: number;
  feasibility: number;
}): number {
  return Math.round(
    (input.momentum / 5) * 20 +
      (input.genZRelevance / 5) * 15 +
      (input.brightNowRelevance / 5) * 20 +
      (input.adaptability / 5) * 15 +
      (input.speedRequired / 5) * 10 +
      (input.businessPotential / 5) * 10 +
      (input.feasibility / 5) * 10,
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["curator", "admin"]);
    const { id } = await context.params;
    const parsed = scoreSchema.safeParse(
      await parseJson<unknown>(request),
    );

    if (!parsed.success) {
      throw new ApiError(400, "Nilai score harus 1 sampai 5.");
    }

    const input = parsed.data;
    const { error } = await supabaseAdmin
      .from("trend_scores")
      .upsert(
        {
          trend_id: id,
          curator_id: user.id,
          momentum_score: input.momentum,
          gen_z_relevance: input.genZRelevance,
          brightnow_relevance: input.brightNowRelevance,
          adaptability: input.adaptability,
          speed_required: input.speedRequired,
          business_potential: input.businessPotential,
          feasibility: input.feasibility,
          final_score: calculateScore(input),
        },
        { onConflict: "trend_id,curator_id" },
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
