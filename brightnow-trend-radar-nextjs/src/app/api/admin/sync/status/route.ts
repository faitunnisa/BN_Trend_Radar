import { errorResponse } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { getSheetSyncStatus } from "@/lib/sheet-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin"]);
    return Response.json(await getSheetSyncStatus());
  } catch (error) {
    return errorResponse(error);
  }
}
