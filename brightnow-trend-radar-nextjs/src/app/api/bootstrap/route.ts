import { ApiError, errorResponse } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { getWorkspaceData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireSession();
    const week = new URL(request.url).searchParams.get("week");
    if (!week) throw new ApiError(400, "Week wajib diisi.");

    return Response.json(await getWorkspaceData(week, user));
  } catch (error) {
    return errorResponse(error);
  }
}
