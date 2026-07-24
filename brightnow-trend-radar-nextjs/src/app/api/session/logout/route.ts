import { errorResponse } from "@/lib/http";
import { revokeCurrentSession } from "@/lib/session";

export async function POST() {
  try {
    await revokeCurrentSession();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
