export type UserRole = "contributor" | "curator" | "admin";
export type TrendStatus =
  | "validate"
  | "watchlist"
  | "ready"
  | "activated"
  | "archived";
export type ActionStatus =
  | "planned"
  | "in_progress"
  | "needs_review"
  | "done";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AppUser {
  id: string;
  displayName: string;
  divisionId: string | null;
  divisionName: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface Division {
  id: string;
  name: string;
  isActive: boolean;
}

export interface TrendScoreInput {
  momentum: number;
  genZRelevance: number;
  brightNowRelevance: number;
  adaptability: number;
  speedRequired: number;
  businessPotential: number;
  feasibility: number;
}

export interface StatusHistoryItem {
  id: string;
  previousStatus: TrendStatus | null;
  newStatus: TrendStatus;
  changedById: string;
  changedByName: string;
  createdAt: string;
}

export interface Trend {
  id: string;
  observedDate: string;
  title: string;
  category: string;
  platform: string;
  momentum: string;
  sourceUrl: string | null;
  evidenceDescription: string | null;
  relevance: string;
  suggestedAction: string | null;
  boardStatus: TrendStatus;
  submittedById: string;
  submittedByName: string;
  submittedByDivision: string;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  hasVoted: boolean;
  opportunityScore: number | null;
  myScore: TrendScoreInput | null;
  statusHistory: StatusHistoryItem[];
}

export interface ActionItem {
  id: string;
  startDate: string;
  endDate: string;
  sourceTrendId: string | null;
  sourceTrendTitle: string | null;
  title: string;
  accountableUserId: string;
  accountableName: string;
  accountableDivision: string;
  status: ActionStatus;
  createdById: string;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  learningId: string | null;
}

export interface Learning {
  id: string;
  publishedDate: string;
  sourceActionId: string;
  sourceActionTitle: string;
  sourceTrendId: string | null;
  sourceTrendTitle: string | null;
  actionOwnerId: string;
  actionOwnerName: string;
  title: string;
  resultKpi: string;
  whatWorked: string | null;
  whatDidntWork: string | null;
  whyItHappened: string | null;
  reusablePrinciple: string;
  evidenceUrl: string | null;
  publishedAt: string;
}

export interface SheetSyncStatus {
  configured: boolean;
  pending: number;
  failed: number;
  sent: number;
}

export interface BootstrapData {
  currentUser: AppUser;
  dateRange: DateRange;
  divisions: Division[];
  users: AppUser[];
  trends: Trend[];
  actions: ActionItem[];
  learnings: Learning[];
  sheetSync: SheetSyncStatus;
}
