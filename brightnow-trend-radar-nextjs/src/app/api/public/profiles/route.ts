import { errorResponse } from "@/lib/http";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsers(true);
    return Response.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}
