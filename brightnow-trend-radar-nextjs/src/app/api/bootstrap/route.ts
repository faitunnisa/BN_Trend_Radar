import { ApiError, errorResponse } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { dateRangeSchema } from "@/lib/validation";
import { getWorkspaceData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireSession();
    const params = new URL(request.url).searchParams;
    const parsed = dateRangeSchema.safeParse({
      startDate: params.get("startDate"),
      endDate: params.get("endDate"),
    });

    if (!parsed.success) {
      throw new ApiError(400, "Pilih rentang tanggal yang valid.");
    }

    return Response.json(
      await getWorkspaceData(
        parsed.data.startDate,
        parsed.data.endDate,
        user,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
