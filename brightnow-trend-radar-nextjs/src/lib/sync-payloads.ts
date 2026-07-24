import { supabaseAdmin } from "@/lib/supabase-admin";

export async function buildTrendPayload(
  trendId: string,
): Promise<Record<string, unknown>> {
  const { data: trend, error } = await supabaseAdmin
    .from("trends")
    .select("*")
    .eq("id", trendId)
    .single();
  if (error) throw error;

  const [{ count: voteCount }, { data: scores }, { data: user }] =
    await Promise.all([
      supabaseAdmin
        .from("trend_votes")
        .select("*", { count: "exact", head: true })
        .eq("trend_id", trendId),
      supabaseAdmin
        .from("trend_scores")
        .select("final_score")
        .eq("trend_id", trendId),
      supabaseAdmin
        .from("app_users")
        .select("display_name,divisions(name)")
        .eq("id", trend.submitted_by)
        .single(),
    ]);

  const scoreRows = scores || [];
  const opportunityScore = scoreRows.length
    ? Math.round(
        scoreRows.reduce(
          (sum, row) => sum + Number(row.final_score),
          0,
        ) / scoreRows.length,
      )
    : "";

  const division = user?.divisions as { name?: string } | null;

  return {
    record_type: "trend_submission",
    id: trend.id,
    created_at: trend.created_at,
    week: trend.submission_week,
    title: trend.title,
    category: trend.category,
    platform: trend.platform,
    momentum: trend.momentum,
    source: trend.source_url || trend.evidence_description || "",
    relevance: trend.relevance,
    suggested_action: trend.suggested_action || "",
    submitter: user?.display_name || "",
    division: division?.name || "Unassigned",
    votes: voteCount || 0,
    opportunity_score: opportunityScore,
    status: trend.board_status,
  };
}

export async function buildActionPayload(
  actionId: string,
): Promise<Record<string, unknown>> {
  const { data: action, error } = await supabaseAdmin
    .from("actions")
    .select("*")
    .eq("id", actionId)
    .single();
  if (error) throw error;

  const [sourceResult, ownerResult, updaterResult] =
    await Promise.all([
      action.source_trend_id
        ? supabaseAdmin
            .from("trends")
            .select("title")
            .eq("id", action.source_trend_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabaseAdmin
        .from("app_users")
        .select("display_name")
        .eq("id", action.accountable_user_id)
        .single(),
      supabaseAdmin
        .from("app_users")
        .select("display_name")
        .eq("id", action.updated_by)
        .single(),
    ]);

  return {
    record_type: "action",
    id: action.id,
    created_at: action.created_at,
    updated_at: action.updated_at,
    week: action.workspace_week,
    title: action.title,
    source_trend_id: action.source_trend_id || "",
    source_trend_title: sourceResult.data?.title || "Standalone",
    accountable: ownerResult.data?.display_name || "",
    work_period: action.work_period,
    status: action.status,
    updated_by: updaterResult.data?.display_name || "",
  };
}

export async function buildLearningPayload(
  learningId: string,
): Promise<Record<string, unknown>> {
  const { data: learning, error } = await supabaseAdmin
    .from("learnings")
    .select("*")
    .eq("id", learningId)
    .single();
  if (error) throw error;

  const [actionResult, trendResult, ownerResult] =
    await Promise.all([
      supabaseAdmin
        .from("actions")
        .select("title")
        .eq("id", learning.source_action_id)
        .single(),
      learning.source_trend_id
        ? supabaseAdmin
            .from("trends")
            .select("title")
            .eq("id", learning.source_trend_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabaseAdmin
        .from("app_users")
        .select("display_name")
        .eq("id", learning.action_owner_id)
        .single(),
    ]);

  return {
    record_type: "learning",
    id: learning.id,
    created_at: learning.published_at,
    title: learning.title,
    source_trend_id: learning.source_trend_id || "",
    source_trend_title: trendResult.data?.title || "Standalone",
    source_action_id: learning.source_action_id,
    source_action_title: actionResult.data?.title || "",
    action_owner: ownerResult.data?.display_name || "",
    result: learning.result_kpi,
    what_worked: learning.what_worked || "",
    what_didnt_work: learning.what_didnt_work || "",
    why_it_happened: learning.why_it_happened || "",
    reusable_principle: learning.reusable_principle,
    evidence_url: learning.evidence_url || "",
  };
}
