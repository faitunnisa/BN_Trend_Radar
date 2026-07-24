import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSheetSyncStatus } from "@/lib/sheet-sync";
import { listUsers } from "@/lib/users";
import type {
  ActionItem,
  AppUser,
  BootstrapData,
  Division,
  Learning,
  StatusHistoryItem,
  Trend,
  TrendScoreInput,
  TrendStatus,
} from "@/lib/types";

type AnyRow = Record<string, any>;

function scoreInput(row: AnyRow): TrendScoreInput {
  return {
    momentum: Number(row.momentum_score),
    genZRelevance: Number(row.gen_z_relevance),
    brightNowRelevance: Number(row.brightnow_relevance),
    adaptability: Number(row.adaptability),
    speedRequired: Number(row.speed_required),
    businessPotential: Number(row.business_potential),
    feasibility: Number(row.feasibility),
  };
}

export async function getWorkspaceData(
  week: string,
  currentUser: AppUser,
): Promise<BootstrapData> {
  const [
    divisionResult,
    users,
    trendResult,
    actionResult,
    sheetSync,
  ] = await Promise.all([
    supabaseAdmin
      .from("divisions")
      .select("id,name,is_active")
      .order("name"),
    listUsers(false),
    supabaseAdmin
      .from("trends")
      .select("*")
      .eq("submission_week", week)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("actions")
      .select("*")
      .eq("workspace_week", week)
      .order("created_at", { ascending: false }),
    getSheetSyncStatus(),
  ]);

  if (divisionResult.error) throw divisionResult.error;
  if (trendResult.error) throw trendResult.error;
  if (actionResult.error) throw actionResult.error;

  const divisions: Division[] = (divisionResult.data || []).map(
    (row: AnyRow) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    }),
  );

  const userMap = new Map(users.map((user) => [user.id, user]));
  const trendRows = (trendResult.data || []) as AnyRow[];
  const actionRows = (actionResult.data || []) as AnyRow[];
  const trendIds = trendRows.map((row) => row.id);
  const actionIds = actionRows.map((row) => row.id);

  const [
    voteResult,
    scoreResult,
    historyResult,
    learningResult,
  ] = await Promise.all([
    trendIds.length
      ? supabaseAdmin
          .from("trend_votes")
          .select("trend_id,user_id")
          .in("trend_id", trendIds)
      : Promise.resolve({ data: [], error: null }),
    trendIds.length
      ? supabaseAdmin
          .from("trend_scores")
          .select("*")
          .in("trend_id", trendIds)
      : Promise.resolve({ data: [], error: null }),
    trendIds.length
      ? supabaseAdmin
          .from("trend_status_history")
          .select("*")
          .in("trend_id", trendIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    actionIds.length
      ? supabaseAdmin
          .from("learnings")
          .select("*")
          .in("source_action_id", actionIds)
          .order("published_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (voteResult.error) throw voteResult.error;
  if (scoreResult.error) throw scoreResult.error;
  if (historyResult.error) throw historyResult.error;
  if (learningResult.error) throw learningResult.error;

  const votes = (voteResult.data || []) as AnyRow[];
  const scores = (scoreResult.data || []) as AnyRow[];
  const histories = (historyResult.data || []) as AnyRow[];
  const learningRows = (learningResult.data || []) as AnyRow[];

  const trendTitleMap = new Map(
    trendRows.map((row) => [row.id, row.title]),
  );
  const actionTitleMap = new Map(
    actionRows.map((row) => [row.id, row.title]),
  );
  const learningByAction = new Map(
    learningRows.map((row) => [row.source_action_id, row]),
  );

  const trends: Trend[] = trendRows.map((row) => {
    const submitter = userMap.get(row.submitted_by);
    const trendVotes = votes.filter(
      (vote) => vote.trend_id === row.id,
    );
    const trendScores = scores.filter(
      (score) => score.trend_id === row.id,
    );
    const averageScore = trendScores.length
      ? trendScores.reduce(
          (sum, score) => sum + Number(score.final_score),
          0,
        ) / trendScores.length
      : null;
    const ownScore = trendScores.find(
      (score) => score.curator_id === currentUser.id,
    );

    const statusHistory: StatusHistoryItem[] = histories
      .filter((item) => item.trend_id === row.id)
      .map((item) => ({
        id: item.id,
        previousStatus: item.previous_status as TrendStatus | null,
        newStatus: item.new_status as TrendStatus,
        changedById: item.changed_by,
        changedByName:
          userMap.get(item.changed_by)?.displayName || "Unknown",
        createdAt: item.created_at,
      }));

    return {
      id: row.id,
      submissionWeek: row.submission_week,
      title: row.title,
      category: row.category,
      platform: row.platform,
      momentum: row.momentum,
      sourceUrl: row.source_url,
      evidenceDescription: row.evidence_description,
      relevance: row.relevance,
      suggestedAction: row.suggested_action,
      boardStatus: row.board_status,
      submittedById: row.submitted_by,
      submittedByName: submitter?.displayName || "Unknown",
      submittedByDivision: submitter?.divisionName || "Unassigned",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      voteCount: trendVotes.length,
      hasVoted: trendVotes.some(
        (vote) => vote.user_id === currentUser.id,
      ),
      opportunityScore:
        averageScore === null ? null : Math.round(averageScore),
      myScore: ownScore ? scoreInput(ownScore) : null,
      statusHistory,
    };
  });

  const actions: ActionItem[] = actionRows.map((row) => {
    const owner = userMap.get(row.accountable_user_id);
    const updater = userMap.get(row.updated_by);
    const learning = learningByAction.get(row.id);

    return {
      id: row.id,
      workspaceWeek: row.workspace_week,
      sourceTrendId: row.source_trend_id,
      sourceTrendTitle: row.source_trend_id
        ? trendTitleMap.get(row.source_trend_id) || null
        : null,
      title: row.title,
      accountableUserId: row.accountable_user_id,
      accountableName: owner?.displayName || "Unknown",
      accountableDivision: owner?.divisionName || "Unassigned",
      workPeriod: row.work_period,
      status: row.status,
      createdById: row.created_by,
      updatedById: row.updated_by,
      updatedByName: updater?.displayName || "Unknown",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      learningId: learning?.id || null,
    };
  });

  const learnings: Learning[] = learningRows.map((row) => {
    const owner = userMap.get(row.action_owner_id);
    return {
      id: row.id,
      sourceActionId: row.source_action_id,
      sourceActionTitle:
        actionTitleMap.get(row.source_action_id) || "Unknown action",
      sourceTrendId: row.source_trend_id,
      sourceTrendTitle: row.source_trend_id
        ? trendTitleMap.get(row.source_trend_id) || null
        : null,
      actionOwnerId: row.action_owner_id,
      actionOwnerName: owner?.displayName || "Unknown",
      title: row.title,
      resultKpi: row.result_kpi,
      whatWorked: row.what_worked,
      whatDidntWork: row.what_didnt_work,
      whyItHappened: row.why_it_happened,
      reusablePrinciple: row.reusable_principle,
      evidenceUrl: row.evidence_url,
      publishedAt: row.published_at,
    };
  });

  return {
    currentUser,
    divisions,
    users,
    trends,
    actions,
    learnings,
    sheetSync,
  };
}
