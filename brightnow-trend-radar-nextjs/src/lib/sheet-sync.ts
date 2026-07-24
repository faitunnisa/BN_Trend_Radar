import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SheetSyncStatus } from "@/lib/types";

type QueueRow = {
  id: string;
  payload: Record<string, unknown>;
  attempt_count: number;
};

async function deliver(row: QueueRow): Promise<boolean> {
  if (!env.googleSheetsWebhookUrl) return false;

  try {
    const response = await fetch(env.googleSheetsWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row.payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Sheets returned HTTP ${response.status}`);
    }

    await supabaseAdmin
      .from("sheet_sync_queue")
      .update({
        status: "sent",
        attempt_count: row.attempt_count + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return true;
  } catch (error) {
    await supabaseAdmin
      .from("sheet_sync_queue")
      .update({
        status: "failed",
        attempt_count: row.attempt_count + 1,
        last_error:
          error instanceof Error ? error.message : "Unknown sync error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return false;
  }
}

export async function queueSheetSync(
  entityType: "trend" | "action" | "learning",
  entityId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("sheet_sync_queue")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      payload,
      status: env.googleSheetsWebhookUrl ? "pending" : "waiting_config",
    })
    .select("id,payload,attempt_count")
    .single();

  if (error) {
    console.error("Could not queue Sheets sync:", error.message);
    return;
  }

  if (env.googleSheetsWebhookUrl) {
    await deliver(data as QueueRow);
  }
}

export async function retryPendingSync(): Promise<number> {
  if (!env.googleSheetsWebhookUrl) return 0;

  const { data, error } = await supabaseAdmin
    .from("sheet_sync_queue")
    .select("id,payload,attempt_count")
    .in("status", ["pending", "failed", "waiting_config"])
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;

  let sent = 0;
  for (const row of (data || []) as QueueRow[]) {
    if (await deliver(row)) sent += 1;
  }
  return sent;
}

export async function getSheetSyncStatus(): Promise<SheetSyncStatus> {
  const { data, error } = await supabaseAdmin
    .from("sheet_sync_queue")
    .select("status");

  if (error) throw error;

  const rows = data || [];
  return {
    configured: Boolean(env.googleSheetsWebhookUrl),
    pending: rows.filter((row) =>
      ["pending", "waiting_config"].includes(row.status),
    ).length,
    failed: rows.filter((row) => row.status === "failed").length,
    sent: rows.filter((row) => row.status === "sent").length,
  };
}
