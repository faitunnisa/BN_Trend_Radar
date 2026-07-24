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

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export async function getWorkspaceData(
  startDate: string,
  endDate: string,
  currentUser: AppUser,
): Promise<BootstrapData> {
  const [divisionResult, users, trendResult, actionResult, learningResult, sheetSync] =
    await Promise.all([
      supabaseAdmin
        .from("divisions")
        .select("id,name,is_active")
        .order("name"),
      listUsers(false),
      supabaseAdmin
        .from("trends")
        .select("*")
        .gte("observed_date", startDate)
        .lte("observed_date", endDate)
        .order("observed_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("actions")
        .select("*")
        .lte("start_date", endDate)
        .gte("end_date", startDate)
        .order("start_date", { ascending: true })
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("learnings")
        .select("*")
        .gte("published_date", startDate)
        .lte("published_date", endDate)
        .order("published_date", { ascending: false })
        .order("published_at", { ascending: false }),
      getSheetSyncStatus(),
    ]);

  if (divisionResult.error) throw divisionResult.error;
  if (trendResult.error) throw trendResult.error;
  if (actionResult.error) throw actionResult.error;
  if (learningResult.error) throw learningResult.error;

  const divisions: Division[] = (divisionResult.data || []).map(
    (row: AnyRow) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    }),
  );

  const userMap = new Map<string, AppUser>(
    users.map((user: AppUser) => [user.id, user]),
  );
  const trendRows = (trendResult.data || []) as AnyRow[];
  const actionRows = (actionResult.data || []) as AnyRow[];
  const learningRows = (learningResult.data || []) as AnyRow[];
  const trendIds = trendRows.map((row) => row.id);

  const [voteResult, scoreResult, historyResult] = await Promise.all([
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
  ]);

  if (voteResult.error) throw voteResult.error;
  if (scoreResult.error) throw scoreResult.error;
  if (historyResult.error) throw historyResult.error;

  const displayedTrendMap = new Map<string, string>(
    trendRows.map((row) => [String(row.id), String(row.title)]),
  );
  const displayedActionMap = new Map<string, string>(
    actionRows.map((row) => [String(row.id), String(row.title)]),
  );

  const neededTrendIds = unique([
    ...actionRows.map((row) => row.source_trend_id),
    ...learningRows.map((row) => row.source_trend_id),
  ]).filter((id) => !displayedTrendMap.has(id));

  const neededActionIds = unique(
    learningRows.map((row) => row.source_action_id),
  ).filter((id) => !displayedActionMap.has(id));

  const [extraTrendResult, extraActionResult] = await Promise.all([
    neededTrendIds.length
      ? supabaseAdmin
          .from("trends")
          .select("id,title")
          .in("id", neededTrendIds)
      : Promise.resolve({ data: [], error: null }),
    neededActionIds.length
      ? supabaseAdmin
          .from("actions")
          .select("id,title")
          .in("id", neededActionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (extraTrendResult.error) throw extraTrendResult.error;
  if (extraActionResult.error) throw extraActionResult.error;

  const trendTitleMap = new Map<string, string>([
    ...displayedTrendMap,
    ...((extraTrendResult.data || []) as AnyRow[]).map(
      (row) => [row.id, row.title] as [string, string],
    ),
  ]);
  const actionTitleMap = new Map<string, string>([
    ...displayedActionMap,
    ...((extraActionResult.data || []) as AnyRow[]).map(
      (row) => [row.id, row.title] as [string, string],
    ),
  ]);
  const learningByAction = new Map(
    learningRows.map((row) => [row.source_action_id, row]),
  );

  const votes = (voteResult.data || []) as AnyRow[];
  const scores = (scoreResult.data || []) as AnyRow[];
  const histories = (historyResult.data || []) as AnyRow[];

  const trends: Trend[] = trendRows.map((row) => {
    const submitter = userMap.get(row.submitted_by);
    const trendVotes = votes.filter((vote) => vote.trend_id === row.id);
    const trendScores = scores.filter((score) => score.trend_id === row.id);
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
      observedDate: row.observed_date,
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
      startDate: row.start_date,
      endDate: row.end_date,
      sourceTrendId: row.source_trend_id,
      sourceTrendTitle: row.source_trend_id
        ? trendTitleMap.get(row.source_trend_id) || null
        : null,
      title: row.title,
      accountableUserId: row.accountable_user_id,
      accountableName: owner?.displayName || "Unknown",
      accountableDivision: owner?.divisionName || "Unassigned",
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
      publishedDate: row.published_date,
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
    dateRange: { startDate, endDate },
    divisions,
    users,
    trends,
    actions,
    learnings,
    sheetSync,
  };
}
