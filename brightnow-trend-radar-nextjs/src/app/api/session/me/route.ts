import { errorResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
