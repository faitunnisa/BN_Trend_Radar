import { errorResponse } from "@/lib/http";
import { requireRole } from "@/lib/session";
import {
  getSheetSyncStatus,
  retryPendingSync,
} from "@/lib/sheet-sync";

export async function POST() {
  try {
    await requireRole(["admin"]);
    const sent = await retryPendingSync();
    return Response.json({
      sent,
      status: await getSheetSyncStatus(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
