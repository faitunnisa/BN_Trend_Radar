import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAvatarUrl } from "@/lib/avatar";
import type { AppUser, UserRole } from "@/lib/types";

const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function mapUser(row: Record<string, unknown>): Promise<AppUser> {
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

export async function createSession(userId: string): Promise<AppUser> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  const { error: sessionError } = await supabaseAdmin
    .from("app_sessions")
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) throw sessionError;

  const cookieStore = await cookies();
  cookieStore.set(env.sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("app_users")
    .select("*, divisions(name)")
    .eq("id", userId)
    .single();

  if (userError) throw userError;
  return mapUser(userRow as Record<string, unknown>);
}

export async function getSessionUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("app_sessions")
    .select("id,user_id,expires_at,revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (sessionError || !session) return null;
  if (session.revoked_at || new Date(session.expires_at) <= new Date()) {
    return null;
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("app_users")
    .select("*, divisions(name)")
    .eq("id", session.user_id)
    .eq("is_active", true)
    .maybeSingle();

  if (userError || !userRow) return null;

  await supabaseAdmin
    .from("app_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.id);

  return mapUser(userRow as Record<string, unknown>);
}

export async function requireSession(): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Silakan pilih profil lagi.");
  return user;
}

export async function requireRole(
  allowed: UserRole[],
): Promise<AppUser> {
  const user = await requireSession();
  if (!allowed.includes(user.role)) {
    throw new ApiError(403, "Kamu tidak punya akses untuk tindakan ini.");
  }
  return user;
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;

  if (token) {
    await supabaseAdmin
      .from("app_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashToken(token));
  }

  cookieStore.delete(env.sessionCookieName);
}
