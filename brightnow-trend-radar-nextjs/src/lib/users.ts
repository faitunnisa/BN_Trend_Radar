import { getAvatarUrl } from "@/lib/avatar";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AppUser, UserRole } from "@/lib/types";

export async function mapUserRow(
  row: Record<string, unknown>,
): Promise<AppUser> {
  const division = row.divisions as { name?: string } | null;
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    divisionId: row.division_id ? String(row.division_id) : null,
    divisionName: division?.name || "Unassigned",
    role: row.role as UserRole,
    avatarUrl: await getAvatarUrl(
      row.photo_path ? String(row.photo_path) : null,
    ),
    isActive: Boolean(row.is_active),
  };
}

export async function listUsers(
  activeOnly = false,
): Promise<AppUser[]> {
  let query = supabaseAdmin
    .from("app_users")
    .select("*, divisions(name)")
    .order("display_name");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data || []).map((row) =>
      mapUserRow(row as Record<string, unknown>),
    ),
  );
}
