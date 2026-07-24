"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ActionItem,
  ActionStatus,
  AppUser,
  BootstrapData,
  Division,
  Learning,
  Trend,
  TrendScoreInput,
  TrendStatus,
  UserRole,
} from "@/lib/types";

const WEEKS = [
  {
    id: "2026-W30",
    label: "Week 4 · 20–26 Jul 2026",
    short: "W4 Jul",
    mission: "School Comeback Signals",
    copy: "Find behavior, language, and mini rituals Gen Z use to prepare for a new week.",
  },
  {
    id: "2026-W31",
    label: "Week 5 · 27 Jul–2 Aug 2026",
    short: "W5 Jul",
    mission: "Payday & Double Date",
    copy: "Spot how Gen Z talks about affordable rewards and getting ready to go out.",
  },
  {
    id: "2026-W32",
    label: "Week 1 · 3–9 Aug 2026",
    short: "W1 Aug",
    mission: "Back-to-School Reality",
    copy: "Collect real school problems, language, and routines that can become initiatives.",
  },
  {
    id: "2026-W33",
    label: "Week 2 · 10–16 Aug 2026",
    short: "W2 Aug",
    mission: "Teen Beauty Signals",
    copy: "Find how teenagers discuss oil, pores, dullness, and quick confidence boosts.",
  },
] as const;

const TREND_STATUSES: TrendStatus[] = [
  "validate",
  "watchlist",
  "ready",
  "activated",
  "archived",
];

const ACTION_STATUSES: Exclude<ActionStatus, "done">[] = [
  "planned",
  "in_progress",
  "needs_review",
];

const SCORE_FIELDS: Array<{
  key: keyof TrendScoreInput;
  label: string;
  weight: number;
}> = [
  { key: "momentum", label: "Momentum", weight: 20 },
  { key: "genZRelevance", label: "Gen Z relevance", weight: 15 },
  {
    key: "brightNowRelevance",
    label: "BrightNow relevance",
    weight: 20,
  },
  { key: "adaptability", label: "Adaptability", weight: 15 },
  { key: "speedRequired", label: "Speed required", weight: 10 },
  { key: "businessPotential", label: "Business potential", weight: 10 },
  { key: "feasibility", label: "Execution feasibility", weight: 10 },
];

const PAGE_COPY: Record<
  string,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "What’s happening, Squad?",
    subtitle:
      "Collect signals, vote together, and turn useful opportunities into BrightNow action.",
  },
  board: {
    title: "Trend Board",
    subtitle:
      "Every contributor can choose and update a trend’s board status.",
  },
  actions: {
    title: "Action Pipeline",
    subtitle:
      "Track the original trend, accountable person, work period, status, and published learning.",
  },
  leaderboard: {
    title: "Leaderboard",
    subtitle:
      "Celebrate useful insight and real activation impact.",
  },
  library: {
    title: "Learning Library",
    subtitle:
      "Learning is published immediately by the Action Owner when an action is completed.",
  },
  team: {
    title: "Team Members",
    subtitle:
      "Master Admin controls the profile list, division, role, active status, and PIN.",
  },
  divisions: {
    title: "Divisions",
    subtitle:
      "Edit the organization structure used across profiles and reporting.",
  },
  sheets: {
    title: "Google Sheets Sync",
    subtitle:
      "Supabase is the shared database; Google Sheets is the reporting mirror.",
  },
  settings: {
    title: "My Settings",
    subtitle:
      "Update your display name, profile picture, or switch profiles.",
  },
};

type View =
  | "dashboard"
  | "board"
  | "actions"
  | "leaderboard"
  | "library"
  | "team"
  | "divisions"
  | "sheets"
  | "settings";

type TrendForm = {
  submissionWeek: string;
  title: string;
  category: string;
  platform: string;
  momentum: string;
  sourceUrl: string;
  evidenceDescription: string;
  relevance: string;
  suggestedAction: string;
  boardStatus: TrendStatus;
};

type ActionForm = {
  id: string | null;
  workspaceWeek: string;
  sourceTrendId: string;
  title: string;
  accountableUserId: string;
  workPeriod: string;
  status: Exclude<ActionStatus, "done">;
};

type LearningForm = {
  title: string;
  resultKpi: string;
  whatWorked: string;
  whatDidntWork: string;
  whyItHappened: string;
  reusablePrinciple: string;
  evidenceUrl: string;
};

type UserForm = {
  displayName: string;
  divisionId: string;
  role: UserRole;
  pin: string;
  isActive: boolean;
};

const EMPTY_SCORE: TrendScoreInput = {
  momentum: 3,
  genZRelevance: 3,
  brightNowRelevance: 3,
  adaptability: 3,
  speedRequired: 3,
  businessPotential: 3,
  feasibility: 3,
};

function statusLabel(value: TrendStatus | ActionStatus): string {
  const labels: Record<string, string> = {
    validate: "Validate",
    watchlist: "Watchlist",
    ready: "Ready",
    activated: "Activated",
    archived: "Archived",
    planned: "Planned",
    in_progress: "In progress",
    needs_review: "Needs review",
    done: "Done",
  };
  return labels[value] || value;
}

function roleLabel(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init.headers
        : {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
          },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Request gagal.");
  }

  return payload as T;
}

function Avatar({
  user,
  className = "avatar",
}: {
  user: AppUser;
  className?: string;
}) {
  if (user.avatarUrl) {
    return (
      <img
        className={className}
        src={user.avatarUrl}
        alt={user.displayName}
      />
    );
  }

  return <div className={className}>{initials(user.displayName)}</div>;
}

function Modal({
  title,
  children,
  onClose,
  large = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  large?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className={`modal ${large ? "modal-lg" : ""}`}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function ProfileGate({
  profiles,
  onSelect,
  busy,
}: {
  profiles: AppUser[];
  onSelect: (user: AppUser, pin?: string) => Promise<void>;
  busy: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [pin, setPin] = useState("");

  const filtered = profiles.filter((profile) =>
    `${profile.displayName} ${profile.divisionName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function choose(user: AppUser) {
    if (user.role === "contributor") {
      await onSelect(user);
      return;
    }
    setSelected(user);
    setPin("");
  }

  return (
    <div className="profile-gate">
      <div className="gate-card">
        <div className="gate-header">
          <img src="/brightnow-logo.png" alt="BrightNow logo" />
          <div>
            <h1>
              Who are <em>you</em> today?
            </h1>
            <p>
              Choose a profile prepared by the Master Admin.
              Contributors enter immediately. Curators and Admins confirm
              their identity using a four-digit PIN.
            </p>
          </div>
        </div>

        <input
          className="profile-search"
          placeholder="Search your name or division..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="profile-grid">
          {filtered.map((profile) => (
            <button
              className="profile-card"
              key={profile.id}
              onClick={() => void choose(profile)}
              disabled={busy}
            >
              <div className="profile-card-top">
                <Avatar user={profile} />
                <div>
                  <strong>{profile.displayName}</strong>
                  <span>{profile.divisionName}</span>
                  <span className="gate-role">
                    {roleLabel(profile.role)}
                    {profile.role !== "contributor"
                      ? " · PIN required"
                      : ""}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!filtered.length && (
          <Empty
            title="No matching profile"
            copy="Ask the Master Admin to add the user."
          />
        )}

        {selected && (
          <div className="pin-panel">
            <h3>Continue as {selected.displayName}</h3>
            <p>
              {roleLabel(selected.role)} access requires a four-digit
              PIN.
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                className="pin-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, ""))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void onSelect(selected, pin);
                  }
                }}
              />
              <button
                className="btn btn-dark"
                disabled={busy || pin.length !== 4}
                onClick={() => void onSelect(selected, pin)}
              >
                Continue
              </button>
              <button
                className="btn btn-light"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TrendRadarApp() {
  const [profiles, setProfiles] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(
    null,
  );
  const [workspace, setWorkspace] =
    useState<BootstrapData | null>(null);
  const [week, setWeek] = useState<string>(WEEKS[0].id);
  const [view, setView] = useState<View>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [trendModal, setTrendModal] = useState(false);
  const [trendDetail, setTrendDetail] = useState<Trend | null>(
    null,
  );
  const [scoreTrend, setScoreTrend] = useState<Trend | null>(
    null,
  );
  const [scoreGuide, setScoreGuide] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [learningAction, setLearningAction] =
    useState<ActionItem | null>(null);
  const [learningDetail, setLearningDetail] =
    useState<Learning | null>(null);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [profileName, setProfileName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [trendForm, setTrendForm] = useState<TrendForm>({
    submissionWeek: WEEKS[0].id,
    title: "",
    category: "Teen Life",
    platform: "TikTok",
    momentum: "Emerging",
    sourceUrl: "",
    evidenceDescription: "",
    relevance: "",
    suggestedAction: "",
    boardStatus: "validate",
  });

  const [actionForm, setActionForm] = useState<ActionForm>({
    id: null,
    workspaceWeek: WEEKS[0].id,
    sourceTrendId: "",
    title: "",
    accountableUserId: "",
    workPeriod: "Week 1 Aug",
    status: "planned",
  });

  const [learningForm, setLearningForm] =
    useState<LearningForm>({
      title: "",
      resultKpi: "",
      whatWorked: "",
      whatDidntWork: "",
      whyItHappened: "",
      reusablePrinciple: "",
      evidenceUrl: "",
    });

  const [scoreForm, setScoreForm] =
    useState<TrendScoreInput>(EMPTY_SCORE);

  const [newDivision, setNewDivision] = useState("");
  const [newUser, setNewUser] = useState<UserForm>({
    displayName: "",
    divisionId: "",
    role: "contributor",
    pin: "",
    isActive: true,
  });
  const [editUserForm, setEditUserForm] = useState<UserForm>({
    displayName: "",
    divisionId: "",
    role: "contributor",
    pin: "",
    isActive: true,
  });

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function initialize() {
    setInitializing(true);
    setError("");
    try {
      const profileResponse = await api<{ users: AppUser[] }>(
        "/api/public/profiles",
      );
      setProfiles(profileResponse.users);

      const response = await fetch("/api/session/me", {
        cache: "no-store",
      });
      if (response.ok) {
        const result = (await response.json()) as {
          user: AppUser;
        };
        setCurrentUser(result.user);
        setProfileName(result.user.displayName);
        await loadWorkspace(WEEKS[0].id);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Aplikasi tidak dapat dibuka.",
      );
    } finally {
      setInitializing(false);
    }
  }

  async function loadProfiles() {
    const result = await api<{ users: AppUser[] }>(
      "/api/public/profiles",
    );
    setProfiles(result.users);
  }

  async function loadWorkspace(targetWeek = week) {
    const result = await api<BootstrapData>(
      `/api/bootstrap?week=${encodeURIComponent(targetWeek)}`,
    );
    setWorkspace(result);
    setCurrentUser(result.currentUser);
    setProfileName(result.currentUser.displayName);
    setWeek(targetWeek);
  }

  async function runMutation(
    operation: () => Promise<void>,
    success: string,
    reload = true,
  ) {
    setBusy(true);
    setError("");
    try {
      await operation();
      if (reload) await loadWorkspace();
      setToast(success);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Request gagal.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function selectProfile(user: AppUser, pin?: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: AppUser }>(
        "/api/session/select",
        {
          method: "POST",
          body: JSON.stringify({ userId: user.id, pin }),
        },
      );
      setCurrentUser(result.user);
      setProfileName(result.user.displayName);
      await loadWorkspace(week);
      setToast(`Welcome, ${result.user.displayName}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Login gagal.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function switchProfile() {
    await api("/api/session/logout", { method: "POST" });
    setCurrentUser(null);
    setWorkspace(null);
    setView("dashboard");
    await loadProfiles();
  }

  async function changeWeek(value: string) {
    setBusy(true);
    setCategoryFilter("All");
    try {
      await loadWorkspace(value);
      setToast(
        `Showing ${WEEKS.find((item) => item.id === value)?.short}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Week gagal dimuat.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = currentUser?.role === "admin";
  const canScore =
    currentUser?.role === "admin" ||
    currentUser?.role === "curator";

  const currentWeek =
    WEEKS.find((item) => item.id === week) || WEEKS[0];

  const activeUsers =
    workspace?.users.filter((user) => user.isActive) || [];

  const topTrends = useMemo(
    () =>
      [...(workspace?.trends || [])].sort(
        (a, b) =>
          (b.opportunityScore || 0) +
          b.voteCount -
          ((a.opportunityScore || 0) + a.voteCount),
      ),
    [workspace?.trends],
  );

  const leaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        user: AppUser;
        submitted: number;
        votes: number;
        ready: number;
        points: number;
      }
    >();

    for (const trend of workspace?.trends || []) {
      const user = workspace?.users.find(
        (item) => item.id === trend.submittedById,
      );
      if (!user) continue;

      const existing = map.get(user.id) || {
        user,
        submitted: 0,
        votes: 0,
        ready: 0,
        points: 0,
      };
      existing.submitted += 1;
      existing.votes += trend.voteCount;
      if (
        trend.boardStatus === "ready" ||
        trend.boardStatus === "activated"
      ) {
        existing.ready += 1;
      }
      existing.points =
        existing.submitted * 2 +
        existing.votes +
        existing.ready * 10;
      map.set(user.id, existing);
    }

    return [...map.values()].sort((a, b) => b.points - a.points);
  }, [workspace?.trends, workspace?.users]);

  function openTrendForm() {
    setTrendForm({
      submissionWeek: week,
      title: "",
      category: "Teen Life",
      platform: "TikTok",
      momentum: "Emerging",
      sourceUrl: "",
      evidenceDescription: "",
      relevance: "",
      suggestedAction: "",
      boardStatus: "validate",
    });
    setTrendModal(true);
  }

  async function submitTrend(event: FormEvent) {
    event.preventDefault();
    await runMutation(
      async () => {
        await api("/api/trends", {
          method: "POST",
          body: JSON.stringify(trendForm),
        });
        setTrendModal(false);
        if (trendForm.submissionWeek !== week) {
          await loadWorkspace(trendForm.submissionWeek);
        }
      },
      "Trend submitted",
      trendForm.submissionWeek === week,
    );
  }

  async function changeTrendStatus(
    trendId: string,
    status: TrendStatus,
  ) {
    await runMutation(
      () =>
        api(`/api/trends/${trendId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      `Trend moved to ${statusLabel(status)}`,
    );
    setTrendDetail(null);
  }

  async function toggleVote(trend: Trend) {
    await runMutation(
      () =>
        api(`/api/trends/${trend.id}/vote`, {
          method: trend.hasVoted ? "DELETE" : "POST",
        }),
      trend.hasVoted ? "Vote removed" : "Trend upvoted",
    );
  }

  function openScore(trend: Trend) {
    setScoreTrend(trend);
    setScoreForm(trend.myScore || EMPTY_SCORE);
  }

  async function saveScore(event: FormEvent) {
    event.preventDefault();
    if (!scoreTrend) return;

    await runMutation(
      async () => {
        await api(`/api/trends/${scoreTrend.id}/score`, {
          method: "POST",
          body: JSON.stringify(scoreForm),
        });
        setScoreTrend(null);
      },
      "Opportunity Score updated",
    );
  }

  function openCreateAction(sourceTrend?: Trend) {
    setActionForm({
      id: null,
      workspaceWeek: week,
      sourceTrendId: sourceTrend?.id || "",
      title: sourceTrend?.suggestedAction || "",
      accountableUserId: currentUser?.id || "",
      workPeriod: "Week 1 Aug",
      status: "planned",
    });
    setActionModal(true);
    setTrendDetail(null);
  }

  function openEditAction(action: ActionItem) {
    setActionForm({
      id: action.id,
      workspaceWeek: action.workspaceWeek,
      sourceTrendId: action.sourceTrendId || "",
      title: action.title,
      accountableUserId: action.accountableUserId,
      workPeriod: action.workPeriod,
      status:
        action.status === "done" ? "needs_review" : action.status,
    });
    setActionModal(true);
  }

  async function saveAction(event: FormEvent) {
    event.preventDefault();
    const path = actionForm.id
      ? `/api/actions/${actionForm.id}`
      : "/api/actions";

    await runMutation(
      async () => {
        await api(path, {
          method: actionForm.id ? "PATCH" : "POST",
          body: JSON.stringify({
            workspaceWeek: actionForm.workspaceWeek,
            sourceTrendId: actionForm.sourceTrendId || null,
            title: actionForm.title,
            accountableUserId: actionForm.accountableUserId,
            workPeriod: actionForm.workPeriod,
            status: actionForm.status,
          }),
        });
        setActionModal(false);
      },
      actionForm.id ? "Action updated" : "Action added",
    );
  }

  function openLearningCapture(action: ActionItem) {
    if (currentUser?.id !== action.accountableUserId) {
      setError(
        "Hanya Action Owner yang bisa menyelesaikan action dan menerbitkan learning.",
      );
      return;
    }
    setLearningAction(action);
    setLearningForm({
      title: "",
      resultKpi: "",
      whatWorked: "",
      whatDidntWork: "",
      whyItHappened: "",
      reusablePrinciple: "",
      evidenceUrl: "",
    });
  }

  async function completeAction(event: FormEvent) {
    event.preventDefault();
    if (!learningAction) return;

    await runMutation(
      async () => {
        await api(
          `/api/actions/${learningAction.id}/complete`,
          {
            method: "POST",
            body: JSON.stringify(learningForm),
          },
        );
        setLearningAction(null);
        setView("library");
      },
      "Action completed and learning published",
    );
  }

  async function deleteAction(action: ActionItem) {
    if (!window.confirm(`Delete action “${action.title}”?`)) return;
    await runMutation(
      () =>
        api(`/api/actions/${action.id}`, {
          method: "DELETE",
        }),
      "Action deleted",
    );
  }

  async function addUser(event: FormEvent) {
    event.preventDefault();
    await runMutation(
      async () => {
        await api("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            displayName: newUser.displayName,
            divisionId: newUser.divisionId || null,
            role: newUser.role,
            pin: newUser.pin || undefined,
          }),
        });
        setNewUser({
          displayName: "",
          divisionId: workspace?.divisions[0]?.id || "",
          role: "contributor",
          pin: "",
          isActive: true,
        });
        await loadProfiles();
      },
      "Team member added",
    );
  }

  function openEditUser(user: AppUser) {
    setEditUser(user);
    setEditUserForm({
      displayName: user.displayName,
      divisionId: user.divisionId || "",
      role: user.role,
      pin: "",
      isActive: user.isActive,
    });
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    if (!editUser) return;

    await runMutation(
      async () => {
        await api(`/api/admin/users/${editUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...editUserForm,
            divisionId: editUserForm.divisionId || null,
            pin: editUserForm.pin || undefined,
          }),
        });
        setEditUser(null);
        await loadProfiles();
      },
      "Team member updated",
    );
  }

  async function deactivateUser(user: AppUser) {
    if (!window.confirm(`Deactivate ${user.displayName}?`)) return;
    await runMutation(
      async () => {
        await api(`/api/admin/users/${user.id}`, {
          method: "DELETE",
        });
        await loadProfiles();
      },
      "User deactivated",
    );
  }

  async function addDivision(event: FormEvent) {
    event.preventDefault();
    await runMutation(
      async () => {
        await api("/api/admin/divisions", {
          method: "POST",
          body: JSON.stringify({ name: newDivision }),
        });
        setNewDivision("");
      },
      "Division added",
    );
  }

  async function renameDivision(division: Division) {
    const name = window.prompt(
      "New division name:",
      division.name,
    );
    if (!name || name === division.name) return;

    await runMutation(
      () =>
        api(`/api/admin/divisions/${division.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name }),
        }),
      "Division renamed",
    );
  }

  async function deleteDivision(division: Division) {
    if (
      !window.confirm(
        `Remove ${division.name}? Existing users will move to Unassigned.`,
      )
    ) {
      return;
    }

    await runMutation(
      () =>
        api(`/api/admin/divisions/${division.id}`, {
          method: "DELETE",
        }),
      "Division removed",
    );
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await runMutation(
      async () => {
        await api("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({ displayName: profileName }),
        });

        if (avatarFile) {
          const form = new FormData();
          form.set("file", avatarFile);
          await api("/api/profile/photo", {
            method: "POST",
            body: form,
          });
        }
        setAvatarFile(null);
        await loadProfiles();
      },
      "Profile updated",
    );
  }

  async function removeAvatar() {
    await runMutation(
      async () => {
        await api("/api/profile/photo", { method: "DELETE" });
        await loadProfiles();
      },
      "Profile picture removed",
    );
  }

  async function retrySync() {
    await runMutation(
      () =>
        api("/api/admin/sync/retry", {
          method: "POST",
        }),
      "Pending sync retried",
    );
  }

  if (initializing) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <img src="/brightnow-logo.png" alt="BrightNow" />
          <h2>Opening Trend Radar...</h2>
          <p>Connecting the workspace and team profiles.</p>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        {error && (
          <div
            className="error-banner"
            style={{
              position: "fixed",
              zIndex: 500,
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {error}
          </div>
        )}
        <ProfileGate
          profiles={profiles}
          onSelect={selectProfile}
          busy={busy}
        />
      </>
    );
  }

  if (!workspace) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <img src="/brightnow-logo.png" alt="BrightNow" />
          <h2>Loading workspace...</h2>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const page = PAGE_COPY[view];

  return (
    <>
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <img src="/brightnow-logo.png" alt="BrightNow logo" />
          <div>
            <strong>Trend Radar</strong>
            <small>
              Discover signals.
              <br />
              Build relevant action.
            </small>
          </div>
        </div>

        <div className="nav-label">Workspace</div>
        <NavButton
          active={view === "dashboard"}
          icon="⌂"
          label="Dashboard"
          onClick={() => {
            setView("dashboard");
            setMobileNav(false);
          }}
        />
        <NavButton
          active={view === "board"}
          icon="▦"
          label="Trend Board"
          badge={workspace.trends.length}
          onClick={() => {
            setView("board");
            setMobileNav(false);
          }}
        />
        <NavButton
          active={view === "actions"}
          icon="↗"
          label="Action Pipeline"
          onClick={() => {
            setView("actions");
            setMobileNav(false);
          }}
        />
        <NavButton
          active={view === "leaderboard"}
          icon="★"
          label="Leaderboard"
          onClick={() => {
            setView("leaderboard");
            setMobileNav(false);
          }}
        />
        <NavButton
          active={view === "library"}
          icon="◫"
          label="Learning Library"
          onClick={() => {
            setView("library");
            setMobileNav(false);
          }}
        />

        {isAdmin && (
          <>
            <div className="nav-label">Master Admin</div>
            <NavButton
              active={view === "team"}
              icon="👥"
              label="Team Members"
              onClick={() => {
                setView("team");
                setMobileNav(false);
              }}
            />
            <NavButton
              active={view === "divisions"}
              icon="◌"
              label="Divisions"
              onClick={() => {
                setView("divisions");
                setMobileNav(false);
              }}
            />
            <NavButton
              active={view === "sheets"}
              icon="▤"
              label="Google Sheets Sync"
              onClick={() => {
                setView("sheets");
                setMobileNav(false);
              }}
            />
          </>
        )}

        <div className="nav-label">Personal</div>
        <NavButton
          active={view === "settings"}
          icon="⚙"
          label="Settings"
          onClick={() => {
            setView("settings");
            setMobileNav(false);
          }}
        />

        <div className="sidebar-profile">
          <div className="profile-main">
            <Avatar user={currentUser} />
            <div className="profile-meta">
              <strong>{currentUser.displayName}</strong>
              <span>
                {currentUser.divisionName} ·{" "}
                {roleLabel(currentUser.role)}
              </span>
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="mini-btn"
              onClick={() => setView("settings")}
            >
              Edit profile
            </button>
            <button
              className="mini-btn"
              onClick={() => void switchProfile()}
            >
              Switch profile
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-bar">
          <button onClick={() => setMobileNav((value) => !value)}>
            ☰
          </button>
          <img
            src="/brightnow-logo.png"
            alt="BrightNow"
            style={{ width: 58, height: 40, objectFit: "contain" }}
          />
          <button onClick={openTrendForm}>＋</button>
        </div>

        <header className="topbar">
          <div className="headline">
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
          </div>
          <div className="top-actions">
            <div className="weekbox">
              <span>WEEK</span>
              <select
                value={week}
                disabled={busy}
                onChange={(event) =>
                  void changeWeek(event.target.value)
                }
              >
                {WEEKS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div
              className={`sync-pill ${
                workspace.sheetSync.configured
                  ? workspace.sheetSync.pending ||
                    workspace.sheetSync.failed
                    ? "pending"
                    : "connected"
                  : ""
              }`}
            >
              <span className="sync-dot" />
              <span>
                {!workspace.sheetSync.configured
                  ? "Sheets not configured"
                  : workspace.sheetSync.pending ||
                      workspace.sheetSync.failed
                    ? "Sheet retry pending"
                    : "Google Sheet connected"}
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={() => setScoreGuide(true)}
              title="How scoring works"
            >
              ?
            </button>
            <button className="btn btn-dark" onClick={openTrendForm}>
              ＋ Submit trend
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            {error}{" "}
            <button
              style={{
                float: "right",
                border: 0,
                background: "transparent",
              }}
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {view === "dashboard" && (
          <DashboardView
            workspace={workspace}
            topTrends={topTrends}
            leaderboard={leaderboard}
            currentWeek={currentWeek}
            currentUser={currentUser}
            canScore={canScore}
            onOpenTrend={setTrendDetail}
            onVote={(trend) => void toggleVote(trend)}
            onCreateAction={openCreateAction}
            onOpenBoard={() => setView("board")}
          />
        )}

        {view === "board" && (
          <BoardView
            trends={workspace.trends}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onStatus={(id, status) =>
              void changeTrendStatus(id, status)
            }
            onVote={(trend) => void toggleVote(trend)}
            onOpen={setTrendDetail}
          />
        )}

        {view === "actions" && (
          <ActionsView
            actions={workspace.actions}
            currentUser={currentUser}
            isAdmin={Boolean(isAdmin)}
            onCreate={() => openCreateAction()}
            onEdit={openEditAction}
            onDelete={(action) => void deleteAction(action)}
            onComplete={openLearningCapture}
            onOpenTrend={(id) => {
              const trend = workspace.trends.find(
                (item) => item.id === id,
              );
              if (trend) setTrendDetail(trend);
            }}
            onOpenLearning={(id) => {
              const learning = workspace.learnings.find(
                (item) => item.id === id,
              );
              if (learning) setLearningDetail(learning);
            }}
          />
        )}

        {view === "leaderboard" && (
          <LeaderboardView leaderboard={leaderboard} />
        )}

        {view === "library" && (
          <LibraryView
            learnings={workspace.learnings}
            onOpen={setLearningDetail}
          />
        )}

        {view === "team" && isAdmin && (
          <TeamView
            users={workspace.users}
            divisions={workspace.divisions}
            currentUser={currentUser}
            newUser={newUser}
            setNewUser={setNewUser}
            busy={busy}
            onAdd={(event) => void addUser(event)}
            onEdit={openEditUser}
            onDeactivate={(user) => void deactivateUser(user)}
          />
        )}

        {view === "divisions" && isAdmin && (
          <DivisionsView
            divisions={workspace.divisions}
            users={workspace.users}
            newDivision={newDivision}
            setNewDivision={setNewDivision}
            onAdd={(event) => void addDivision(event)}
            onRename={(division) => void renameDivision(division)}
            onDelete={(division) => void deleteDivision(division)}
          />
        )}

        {view === "sheets" && isAdmin && (
          <SheetsView
            status={workspace.sheetSync}
            busy={busy}
            onRetry={() => void retrySync()}
          />
        )}

        {view === "settings" && (
          <SettingsView
            user={currentUser}
            profileName={profileName}
            setProfileName={setProfileName}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            busy={busy}
            onSave={(event) => void saveProfile(event)}
            onRemoveAvatar={() => void removeAvatar()}
            onSwitch={() => void switchProfile()}
          />
        )}
      </main>

      {trendModal && (
        <Modal
          title="Submit a trend"
          onClose={() => setTrendModal(false)}
        >
          <TrendFormView
            form={trendForm}
            setForm={setTrendForm}
            busy={busy}
            onSubmit={(event) => void submitTrend(event)}
          />
        </Modal>
      )}

      {trendDetail && (
        <Modal
          title={trendDetail.title}
          large
          onClose={() => setTrendDetail(null)}
        >
          <TrendDetailView
            trend={trendDetail}
            actions={workspace.actions.filter(
              (action) =>
                action.sourceTrendId === trendDetail.id,
            )}
            canScore={Boolean(canScore)}
            onStatus={(status) =>
              void changeTrendStatus(trendDetail.id, status)
            }
            onVote={() => void toggleVote(trendDetail)}
            onScore={() => openScore(trendDetail)}
            onCreateAction={() => openCreateAction(trendDetail)}
          />
        </Modal>
      )}

      {scoreTrend && (
        <Modal
          title="Curator scoring"
          onClose={() => setScoreTrend(null)}
        >
          <ScoreFormView
            form={scoreForm}
            setForm={setScoreForm}
            busy={busy}
            onSubmit={(event) => void saveScore(event)}
          />
        </Modal>
      )}

      {scoreGuide && (
        <Modal
          title="How Opportunity Score works"
          onClose={() => setScoreGuide(false)}
        >
          <div className="grid">
            <div className="info-block">
              <strong>Who scores?</strong>
              Curator or Admin. Contributor upvotes stay separate from
              the strategic score.
            </div>
            <div className="info-block">
              <strong>Weighted criteria</strong>
              Momentum 20% · Gen Z relevance 15% · BrightNow
              relevance 20% · Adaptability 15% · Speed 10% · Business
              potential 10% · Feasibility 10%.
            </div>
            <div className="info-block">
              <strong>Interpretation</strong>
              80–100 Activate now · 60–79 Test this week · 40–59
              Watchlist · Below 40 Archive.
            </div>
          </div>
        </Modal>
      )}

      {actionModal && (
        <Modal
          title={actionForm.id ? "Edit action" : "Add an action"}
          onClose={() => setActionModal(false)}
        >
          <ActionFormView
            form={actionForm}
            setForm={setActionForm}
            trends={workspace.trends}
            users={activeUsers}
            busy={busy}
            onSubmit={(event) => void saveAction(event)}
          />
        </Modal>
      )}

      {learningAction && (
        <Modal
          title="Complete action & publish learning"
          onClose={() => setLearningAction(null)}
        >
          <LearningFormView
            action={learningAction}
            form={learningForm}
            setForm={setLearningForm}
            busy={busy}
            onSubmit={(event) => void completeAction(event)}
          />
        </Modal>
      )}

      {learningDetail && (
        <Modal
          title={learningDetail.title}
          large
          onClose={() => setLearningDetail(null)}
        >
          <LearningDetailView learning={learningDetail} />
        </Modal>
      )}

      {editUser && isAdmin && (
        <Modal
          title="Edit team member"
          onClose={() => setEditUser(null)}
        >
          <UserEditFormView
            form={editUserForm}
            setForm={setEditUserForm}
            divisions={workspace.divisions}
            busy={busy}
            onSubmit={(event) => void saveUser(event)}
          />
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function NavButton({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      {label}
      {badge !== undefined && (
        <span className="nav-badge">{badge}</span>
      )}
    </button>
  );
}

function DashboardView({
  workspace,
  topTrends,
  leaderboard,
  currentWeek,
  currentUser,
  canScore,
  onOpenTrend,
  onVote,
  onCreateAction,
  onOpenBoard,
}: {
  workspace: BootstrapData;
  topTrends: Trend[];
  leaderboard: Array<{
    user: AppUser;
    submitted: number;
    votes: number;
    ready: number;
    points: number;
  }>;
  currentWeek: (typeof WEEKS)[number];
  currentUser: AppUser;
  canScore: boolean;
  onOpenTrend: (trend: Trend) => void;
  onVote: (trend: Trend) => void;
  onCreateAction: (trend?: Trend) => void;
  onOpenBoard: () => void;
}) {
  const hero = topTrends[0];
  const average = workspace.trends.length
    ? Math.round(
        workspace.trends.reduce(
          (sum, item) => sum + (item.opportunityScore || 0),
          0,
        ) / workspace.trends.length,
      )
    : 0;

  const metrics = [
    [
      "Submissions",
      workspace.trends.length,
      "Added in selected week",
      "✦",
    ],
    [
      "Squad votes",
      workspace.trends.reduce(
        (sum, item) => sum + item.voteCount,
        0,
      ),
      "One vote per user",
      "▲",
    ],
    [
      "Ready to act",
      workspace.trends.filter(
        (item) => item.boardStatus === "ready",
      ).length,
      "Contributor-selected",
      "↗",
    ],
    ["Avg. score", average || "—", "Strategic opportunity", "★"],
  ];

  return (
    <>
      <div className="grid grid-4">
        {metrics.map((metric) => (
          <article className="card metric" key={metric[0]}>
            <div className="metric-shape">{metric[3]}</div>
            <div className="metric-label">{metric[0]}</div>
            <div className="metric-value">{metric[1]}</div>
            <div className="metric-note">{metric[2]}</div>
          </article>
        ))}
      </div>

      <div className="grid dashboard-grid" style={{ marginTop: 15 }}>
        <div className="grid">
          <article className="card hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                <span>Signal of the week</span>
              </div>
              <h2>
                {hero ? hero.title : "Discover, create, act."}
              </h2>
              <p>
                {hero
                  ? hero.relevance
                  : "No signal has been submitted for this week yet."}
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-light"
                  onClick={() =>
                    hero ? onOpenTrend(hero) : onOpenBoard()
                  }
                >
                  {hero ? "View signal" : "Open board"}
                </button>
                <button
                  className="btn btn-dark"
                  onClick={() => onCreateAction(hero)}
                >
                  Create action →
                </button>
              </div>
            </div>
            <div className="hero-bubble">
              Squad-picked
              <br />
              opportunity ✦
            </div>
          </article>

          <article className="card">
            <div className="section-head">
              <div>
                <h2>Top opportunities</h2>
                <p>
                  Strategic score and squad upvotes are deliberately
                  separate.
                </p>
              </div>
              <button
                className="btn btn-light btn-sm"
                onClick={onOpenBoard}
              >
                Open board
              </button>
            </div>
            <div className="opportunity-grid">
              {topTrends.slice(0, 4).map((trend) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  onOpen={() => onOpenTrend(trend)}
                  onVote={() => onVote(trend)}
                />
              ))}
            </div>
            {!topTrends.length && (
              <Empty
                title="No trends yet"
                copy="Submit the first signal for this week."
              />
            )}
          </article>
        </div>

        <aside className="grid">
          <article className="card sage mission">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              <span>Weekly mission</span>
            </div>
            <h3>{currentWeek.mission}</h3>
            <p>{currentWeek.copy}</p>
            <div className="progress">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (workspace.trends.length / 20) * 100,
                  )}%`,
                }}
              />
            </div>
            <div className="progress-foot">
              <span>{workspace.trends.length} submissions</span>
              <span>Goal: 20</span>
            </div>
          </article>

          <article className="card">
            <div className="section-head">
              <div>
                <h2>Squad leaderboard</h2>
                <p>Impact points for the selected week.</p>
              </div>
            </div>
            <div className="leader-list">
              {leaderboard.slice(0, 4).map((item, index) => (
                <div className="leader" key={item.user.id}>
                  <div className="leader-rank">{index + 1}</div>
                  <Avatar
                    user={item.user}
                    className="avatar small"
                  />
                  <div>
                    <strong>{item.user.displayName}</strong>
                    <span>{item.user.divisionName}</span>
                  </div>
                  <div className="leader-points">
                    {item.points} pts
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card pink">
            <div className="section-head">
              <div>
                <h2>Your access</h2>
                <p>
                  Signed in as {roleLabel(currentUser.role)}.
                </p>
              </div>
            </div>
            <div className="info-block">
              <strong>
                {currentUser.displayName} ·{" "}
                {currentUser.divisionName}
              </strong>
              You can submit trends, select board status, upvote, and
              manage actions.
              {canScore
                ? " You can also score trends."
                : ""}
              {currentUser.role === "admin"
                ? " You also manage users, divisions, deletion, and sync."
                : ""}
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}

function TrendCard({
  trend,
  onOpen,
  onVote,
}: {
  trend: Trend;
  onOpen: () => void;
  onVote: () => void;
}) {
  return (
    <article className="trend-card">
      <div className="trend-top">
        <div>
          <div className="chips">
            <span className="chip">{trend.category}</span>
            <span className="chip">{trend.momentum}</span>
          </div>
          <h3>{trend.title}</h3>
          <p>{trend.evidenceDescription || trend.sourceUrl}</p>
        </div>
        <div className="score">
          {trend.opportunityScore ?? "—"}
        </div>
      </div>
      <div className="trend-foot">
        <div className="byline">{trend.submittedByName}</div>
        <div style={{ display: "flex", gap: 5 }}>
          <button className="btn btn-light btn-sm" onClick={onOpen}>
            Open
          </button>
          <button
            className={`vote ${trend.hasVoted ? "voted" : ""}`}
            onClick={onVote}
          >
            ▲ {trend.voteCount}
          </button>
        </div>
      </div>
    </article>
  );
}

function BoardView({
  trends,
  categoryFilter,
  setCategoryFilter,
  onStatus,
  onVote,
  onOpen,
}: {
  trends: Trend[];
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  onStatus: (id: string, status: TrendStatus) => void;
  onVote: (trend: Trend) => void;
  onOpen: (trend: Trend) => void;
}) {
  const categories = [
    "All",
    ...Array.from(new Set(trends.map((trend) => trend.category))),
  ];
  const filtered =
    categoryFilter === "All"
      ? trends
      : trends.filter(
          (trend) => trend.category === categoryFilter,
        );

  return (
    <>
      <div className="filterbar">
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              letterSpacing: "-.045em",
            }}
          >
            Trend Board
          </h2>
          <p style={{ fontSize: 9, color: "var(--muted)" }}>
            Contributor chooses the board status.
          </p>
        </div>
        <div className="filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter ${
                categoryFilter === category ? "active" : ""
              }`}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="board">
        {TREND_STATUSES.map((status) => {
          const items = filtered.filter(
            (trend) => trend.boardStatus === status,
          );
          return (
            <div className="column" key={status}>
              <div className="column-head">
                <strong>{statusLabel(status)}</strong>
                <span className="column-count">{items.length}</span>
              </div>
              {items.map((trend) => (
                <article className="board-card" key={trend.id}>
                  <div className="chips">
                    <span className="chip">{trend.category}</span>
                  </div>
                  <h3>{trend.title}</h3>
                  <p>
                    {trend.evidenceDescription ||
                      trend.sourceUrl ||
                      trend.relevance}
                  </p>
                  <div style={{ marginTop: 9 }}>
                    <select
                      className="status-select"
                      value={trend.boardStatus}
                      onChange={(event) =>
                        onStatus(
                          trend.id,
                          event.target.value as TrendStatus,
                        )
                      }
                    >
                      {TREND_STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {statusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="board-foot">
                    <small>
                      {trend.submittedByName} · score{" "}
                      {trend.opportunityScore ?? "—"}
                    </small>
                    <button
                      className={`vote ${
                        trend.hasVoted ? "voted" : ""
                      }`}
                      onClick={() => onVote(trend)}
                    >
                      ▲ {trend.voteCount}
                    </button>
                  </div>
                  <button
                    className="btn btn-light btn-sm"
                    style={{ width: "100%", marginTop: 7 }}
                    onClick={() => onOpen(trend)}
                  >
                    Open trend
                  </button>
                </article>
              ))}
              {!items.length && (
                <Empty
                  title="Empty"
                  copy={`No ${statusLabel(status).toLowerCase()} trends.`}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ActionsView({
  actions,
  currentUser,
  isAdmin,
  onCreate,
  onEdit,
  onDelete,
  onComplete,
  onOpenTrend,
  onOpenLearning,
}: {
  actions: ActionItem[];
  currentUser: AppUser;
  isAdmin: boolean;
  onCreate: () => void;
  onEdit: (action: ActionItem) => void;
  onDelete: (action: ActionItem) => void;
  onComplete: (action: ActionItem) => void;
  onOpenTrend: (id: string) => void;
  onOpenLearning: (id: string) => void;
}) {
  const metrics = [
    ["Actions", actions.length, "Selected week", "↗"],
    [
      "In progress",
      actions.filter((item) => item.status === "in_progress")
        .length,
      "Currently being worked on",
      "✦",
    ],
    [
      "Need review",
      actions.filter((item) => item.status === "needs_review")
        .length,
      "Waiting for decision",
      "?",
    ],
    [
      "Done",
      actions.filter((item) => item.status === "done").length,
      "Learning published",
      "✓",
    ],
  ];

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 15 }}>
        {metrics.map((metric) => (
          <article className="card metric" key={metric[0]}>
            <div className="metric-shape">{metric[3]}</div>
            <div className="metric-label">{metric[0]}</div>
            <div className="metric-value">{metric[1]}</div>
            <div className="metric-note">{metric[2]}</div>
          </article>
        ))}
      </div>

      <article className="card">
        <div className="section-head">
          <div>
            <h2>Action Pipeline</h2>
            <p>
              Every contributor can create and edit actions. Source
              Trend is tracked end-to-end.
            </p>
          </div>
          <button className="btn btn-dark" onClick={onCreate}>
            ＋ Add action
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Source trend</th>
                <th>Accountable</th>
                <th>Work period</th>
                <th>Status</th>
                <th>Learning</th>
                <th>Updated by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td>
                    <strong>{action.title}</strong>
                  </td>
                  <td>
                    {action.sourceTrendId ? (
                      <button
                        className="source-link"
                        onClick={() =>
                          onOpenTrend(action.sourceTrendId as string)
                        }
                      >
                        {action.sourceTrendTitle}
                      </button>
                    ) : (
                      "Standalone"
                    )}
                  </td>
                  <td>{action.accountableName}</td>
                  <td>{action.workPeriod}</td>
                  <td>
                    <span
                      className={`status ${
                        action.status === "planned"
                          ? "status-planned"
                          : action.status === "in_progress"
                            ? "status-progress"
                            : action.status === "needs_review"
                              ? "status-review"
                              : "status-done"
                      }`}
                    >
                      {statusLabel(action.status)}
                    </span>
                  </td>
                  <td>
                    {action.learningId ? (
                      <button
                        className="source-link"
                        onClick={() =>
                          onOpenLearning(
                            action.learningId as string,
                          )
                        }
                      >
                        Published learning →
                      </button>
                    ) : action.status === "done" ? (
                      "Learning missing"
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{action.updatedByName}</td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {action.status !== "done" && (
                        <button
                          className="btn btn-light btn-sm"
                          onClick={() => onEdit(action)}
                        >
                          Edit
                        </button>
                      )}
                      {action.status !== "done" &&
                        action.accountableUserId ===
                          currentUser.id && (
                          <button
                            className="btn btn-sage btn-sm"
                            onClick={() => onComplete(action)}
                          >
                            Complete
                          </button>
                        )}
                      {isAdmin && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDelete(action)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!actions.length && (
            <Empty
              title="No actions this week"
              copy="Create one from a trend or as a standalone action."
            />
          )}
        </div>
      </article>
    </>
  );
}

function LeaderboardView({
  leaderboard,
}: {
  leaderboard: Array<{
    user: AppUser;
    submitted: number;
    votes: number;
    ready: number;
    points: number;
  }>;
}) {
  const mvp = leaderboard[0];
  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 15 }}>
        <article
          className="card yellow"
          style={{ gridColumn: "span 2", minHeight: 255 }}
        >
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>Trend MVP</span>
          </div>
          <h2
            style={{
              fontSize: 36,
              lineHeight: 1.04,
              letterSpacing: "-.055em",
              margin: "30px 0 11px",
              maxWidth: 650,
            }}
          >
            {mvp
              ? `${mvp.user.displayName} is this week’s sharpest spotter.`
              : "No MVP yet."}
          </h2>
          <p style={{ fontSize: 10, maxWidth: 600 }}>
            {mvp
              ? `${mvp.submitted} submissions · ${mvp.votes} votes · ${mvp.ready} action-ready opportunities.`
              : "Submit and vote to create the ranking."}
          </p>
        </article>
        <article className="card pink mission">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>Team reward</span>
          </div>
          <h3>Trend Hunt Lunch</h3>
          <p>
            Unlock the squad reward at 300 weekly impact points.
          </p>
          <div className="progress">
            <span style={{ width: "79%" }} />
          </div>
          <div className="progress-foot">
            <span>237 pts</span>
            <span>300 pts</span>
          </div>
        </article>
      </div>
      <article className="card table-wrap">
        <div className="section-head">
          <div>
            <h2>Individual leaderboard</h2>
            <p>
              Points reward useful and action-ready insight, not
              submission spam.
            </p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Contributor</th>
              <th>Division</th>
              <th>Submitted</th>
              <th>Votes</th>
              <th>Action-ready</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr key={item.user.id}>
                <td>{index + 1}</td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Avatar
                      user={item.user}
                      className="avatar small"
                    />
                    <strong>{item.user.displayName}</strong>
                  </div>
                </td>
                <td>{item.user.divisionName}</td>
                <td>{item.submitted}</td>
                <td>{item.votes}</td>
                <td>{item.ready}</td>
                <td>
                  <strong>{item.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}

function LibraryView({
  learnings,
  onOpen,
}: {
  learnings: Learning[];
  onOpen: (learning: Learning) => void;
}) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Learning Library</h2>
          <p>
            Published immediately by the Action Owner—no Curator
            approval required.
          </p>
        </div>
      </div>
      <div className="grid grid-3">
        {learnings.map((learning, index) => (
          <article
            key={learning.id}
            className={`card learning-card ${
              ["yellow", "pink", "sage", "blue"][index % 4]
            }`}
            onClick={() => onOpen(learning)}
          >
            <div className="chips">
              <span className="chip">Published learning</span>
              <span className="chip">
                {learning.actionOwnerName}
              </span>
            </div>
            <h3
              style={{
                fontSize: 17,
                letterSpacing: "-.03em",
                margin: "17px 0 7px",
              }}
            >
              {learning.title}
            </h3>
            <p style={{ fontSize: 9, lineHeight: 1.55 }}>
              <strong>Result:</strong> {learning.resultKpi}
            </p>
            <p
              style={{
                fontSize: 9,
                lineHeight: 1.55,
                marginTop: 8,
              }}
            >
              <strong>Reusable principle:</strong>{" "}
              {learning.reusablePrinciple}
            </p>
            <div className="learning-lineage">
              <span>
                <strong>Trend:</strong>{" "}
                {learning.sourceTrendTitle || "Standalone"}
              </span>
              <span>
                <strong>Action:</strong>{" "}
                {learning.sourceActionTitle}
              </span>
              <span>
                <strong>Published:</strong>{" "}
                {formatDate(learning.publishedAt)}
              </span>
            </div>
          </article>
        ))}
        {!learnings.length && (
          <Empty
            title="No learning published yet"
            copy="An Action Owner can publish one when completing an action."
          />
        )}
      </div>
    </>
  );
}

function TeamView({
  users,
  divisions,
  currentUser,
  newUser,
  setNewUser,
  busy,
  onAdd,
  onEdit,
  onDeactivate,
}: {
  users: AppUser[];
  divisions: Division[];
  currentUser: AppUser;
  newUser: UserForm;
  setNewUser: (value: UserForm) => void;
  busy: boolean;
  onAdd: (event: FormEvent) => void;
  onEdit: (user: AppUser) => void;
  onDeactivate: (user: AppUser) => void;
}) {
  return (
    <>
      <div className="grid grid-2">
        <article className="card">
          <div className="section-head">
            <div>
              <h2>Add team member</h2>
              <p>
                The new profile appears on the profile picker.
              </p>
            </div>
          </div>
          <form className="form-grid" onSubmit={onAdd}>
            <div className="field">
              <label>Display name</label>
              <input
                required
                value={newUser.displayName}
                onChange={(event) =>
                  setNewUser({
                    ...newUser,
                    displayName: event.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Division</label>
              <select
                required
                value={newUser.divisionId}
                onChange={(event) =>
                  setNewUser({
                    ...newUser,
                    divisionId: event.target.value,
                  })
                }
              >
                <option value="">Choose division</option>
                {divisions
                  .filter((division) => division.isActive)
                  .map((division) => (
                    <option
                      key={division.id}
                      value={division.id}
                    >
                      {division.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser({
                    ...newUser,
                    role: event.target.value as UserRole,
                    pin:
                      event.target.value === "contributor"
                        ? ""
                        : newUser.pin,
                  })
                }
              >
                <option value="contributor">Contributor</option>
                <option value="curator">Curator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {newUser.role !== "contributor" && (
              <div className="field">
                <label>4-digit PIN</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={newUser.pin}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      pin: event.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            )}
            <div className="field full">
              <button
                className="btn btn-dark"
                disabled={busy}
                type="submit"
              >
                Add member
              </button>
            </div>
          </form>
        </article>

        <article className="card yellow">
          <div className="section-head">
            <div>
              <h2>Role rules</h2>
              <p>Designed for a trusted internal squad.</p>
            </div>
          </div>
          <div className="info-block">
            <strong>Contributor</strong>
            No PIN. Submit and move trends, vote, and manage Action
            Pipeline.
          </div>
          <div className="info-block" style={{ marginTop: 8 }}>
            <strong>Curator</strong>
            PIN required. Contributor access plus Opportunity Score.
          </div>
          <div className="info-block" style={{ marginTop: 8 }}>
            <strong>Admin</strong>
            PIN required. Full user, division, deletion, and sync
            access.
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 15 }}>
        <div className="section-head">
          <div>
            <h2>Team member master</h2>
            <p>
              Edit identity, division, role, active status, or PIN.
            </p>
          </div>
        </div>
        <div className="user-list">
          {users.map((user) => (
            <div
              className={`member-card ${
                user.isActive ? "" : "inactive"
              }`}
              key={user.id}
            >
              <Avatar user={user} />
              <div className="member-info">
                <strong>{user.displayName}</strong>
                <span>{user.divisionName}</span>
                <span className="role-badge">
                  {roleLabel(user.role)} ·{" "}
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="member-actions">
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => onEdit(user)}
                >
                  Edit
                </button>
                {user.id !== currentUser.id && user.isActive && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDeactivate(user)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

function DivisionsView({
  divisions,
  users,
  newDivision,
  setNewDivision,
  onAdd,
  onRename,
  onDelete,
}: {
  divisions: Division[];
  users: AppUser[];
  newDivision: string;
  setNewDivision: (value: string) => void;
  onAdd: (event: FormEvent) => void;
  onRename: (division: Division) => void;
  onDelete: (division: Division) => void;
}) {
  return (
    <div className="grid grid-2">
      <article className="card">
        <div className="section-head">
          <div>
            <h2>Division master</h2>
            <p>Rename or remove divisions from the workspace.</p>
          </div>
        </div>
        <div className="division-list">
          {divisions.map((division) => (
            <div className="division-row" key={division.id}>
              <input value={division.name} readOnly />
              <button
                className="btn btn-light btn-sm"
                onClick={() => onRename(division)}
                disabled={division.name === "Unassigned"}
              >
                Rename
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(division)}
                disabled={division.name === "Unassigned"}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form className="add-row" onSubmit={onAdd}>
          <input
            required
            placeholder="New division name"
            value={newDivision}
            onChange={(event) =>
              setNewDivision(event.target.value)
            }
          />
          <button className="btn btn-dark btn-sm">Add</button>
        </form>
      </article>

      <article className="card sage">
        <div className="section-head">
          <div>
            <h2>Current composition</h2>
            <p>Active members per division.</p>
          </div>
        </div>
        {divisions
          .filter((division) => division.isActive)
          .map((division) => {
            const count = users.filter(
              (user) =>
                user.isActive &&
                user.divisionId === division.id,
            ).length;
            return (
              <div
                key={division.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom:
                    "1px solid rgba(16,16,16,.12)",
                  fontSize: 9,
                }}
              >
                <strong>{division.name}</strong>
                <span>
                  {count} active member{count === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
      </article>
    </div>
  );
}

function SheetsView({
  status,
  busy,
  onRetry,
}: {
  status: BootstrapData["sheetSync"];
  busy: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="grid grid-2">
      <article className="card yellow">
        <div className="section-head">
          <div>
            <h2>Google Sheets connection</h2>
            <p>
              URL is stored securely in Vercel Environment Variables,
              not entered in the browser.
            </p>
          </div>
        </div>
        <div className="info-block">
          <strong>
            {status.configured
              ? "Connector configured"
              : "Connector not configured"}
          </strong>
          Supabase remains the source of truth. Google Sheets receives
          a mirror of trends, actions, and learnings.
        </div>
        <button
          className="btn btn-dark"
          style={{ marginTop: 12 }}
          disabled={busy || !status.configured}
          onClick={onRetry}
        >
          Retry pending records
        </button>
      </article>
      <article className="card">
        <div className="section-head">
          <div>
            <h2>Sync health</h2>
            <p>Server-confirmed delivery status.</p>
          </div>
        </div>
        <div className="grid grid-3">
          <div className="info-block">
            <strong>{status.sent}</strong>
            Sent
          </div>
          <div className="info-block">
            <strong>{status.pending}</strong>
            Pending
          </div>
          <div className="info-block">
            <strong>{status.failed}</strong>
            Failed
          </div>
        </div>
      </article>
    </div>
  );
}

function SettingsView({
  user,
  profileName,
  setProfileName,
  avatarFile,
  setAvatarFile,
  busy,
  onSave,
  onRemoveAvatar,
  onSwitch,
}: {
  user: AppUser;
  profileName: string;
  setProfileName: (value: string) => void;
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  busy: boolean;
  onSave: (event: FormEvent) => void;
  onRemoveAvatar: () => void;
  onSwitch: () => void;
}) {
  const preview = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user.avatarUrl;

  return (
    <div className="settings-grid">
      <article className="card">
        <img
          className="profile-logo"
          src="/brightnow-logo.png"
          alt="BrightNow"
        />
        <div className="section-head">
          <div>
            <h2>My profile</h2>
            <p>Every user can personalize their profile picture.</p>
          </div>
        </div>
        <form className="profile-editor" onSubmit={onSave}>
          <div>
            <div className="photo-preview">
              {preview ? (
                <img src={preview} alt="Profile preview" />
              ) : (
                initials(profileName)
              )}
            </div>
            <label
              className="btn btn-light btn-sm"
              style={{ width: "100%", marginTop: 9 }}
            >
              Upload photo
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAvatarFile(event.target.files?.[0] || null)
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-light btn-sm"
              style={{ width: "100%", marginTop: 6 }}
              onClick={onRemoveAvatar}
            >
              Remove photo
            </button>
          </div>
          <div className="grid">
            <div className="field">
              <label>Display name</label>
              <input
                required
                value={profileName}
                onChange={(event) =>
                  setProfileName(event.target.value)
                }
              />
            </div>
            <div className="field">
              <label>Division</label>
              <input value={user.divisionName} disabled />
            </div>
            <div className="field">
              <label>Role</label>
              <input value={roleLabel(user.role)} disabled />
            </div>
            <button
              className="btn btn-dark"
              disabled={busy}
              type="submit"
            >
              Save my profile
            </button>
          </div>
        </form>
      </article>

      <article className="card pink">
        <div className="section-head">
          <div>
            <h2>Session</h2>
            <p>
              The secure server session remembers this profile for 30
              days.
            </p>
          </div>
        </div>
        <div className="info-block">
          <strong>Current profile</strong>
          {user.displayName} · {user.divisionName} ·{" "}
          {roleLabel(user.role)}
        </div>
        <button
          className="btn btn-dark"
          style={{ width: "100%", marginTop: 11 }}
          onClick={onSwitch}
        >
          Switch profile
        </button>
      </article>
    </div>
  );
}

function TrendFormView({
  form,
  setForm,
  busy,
  onSubmit,
}: {
  form: TrendForm;
  setForm: (value: TrendForm) => void;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="field full">
        <label>Trend title</label>
        <input
          required
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
        />
      </div>
      <div className="field">
        <label>Submission week</label>
        <select
          value={form.submissionWeek}
          onChange={(event) =>
            setForm({
              ...form,
              submissionWeek: event.target.value,
            })
          }
        >
          {WEEKS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Trend category</label>
        <select
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
        >
          {[
            "Teen Life",
            "Commerce",
            "Meme & Language",
            "Beauty",
            "Content Format",
            "Creator & Figure",
            "Competitor",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Platform</label>
        <select
          value={form.platform}
          onChange={(event) =>
            setForm({ ...form, platform: event.target.value })
          }
        >
          {[
            "TikTok",
            "Instagram",
            "X",
            "YouTube",
            "Offline / Culture",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Momentum</label>
        <select
          value={form.momentum}
          onChange={(event) =>
            setForm({ ...form, momentum: event.target.value })
          }
        >
          {["Emerging", "Rising", "Peaking", "Saturated"].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
      </div>
      <div className="field">
        <label>Board status</label>
        <select
          value={form.boardStatus}
          onChange={(event) =>
            setForm({
              ...form,
              boardStatus: event.target.value as TrendStatus,
            })
          }
        >
          {TREND_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label>Source link</label>
        <input
          type="url"
          value={form.sourceUrl}
          onChange={(event) =>
            setForm({ ...form, sourceUrl: event.target.value })
          }
          placeholder="Optional URL"
        />
      </div>
      <div className="field full">
        <label>Evidence / what is happening</label>
        <textarea
          value={form.evidenceDescription}
          onChange={(event) =>
            setForm({
              ...form,
              evidenceDescription: event.target.value,
            })
          }
        />
      </div>
      <div className="field full">
        <label>Why BrightNow should care</label>
        <textarea
          required
          value={form.relevance}
          onChange={(event) =>
            setForm({ ...form, relevance: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <label>Suggested next action</label>
        <textarea
          value={form.suggestedAction}
          onChange={(event) =>
            setForm({
              ...form,
              suggestedAction: event.target.value,
            })
          }
        />
      </div>
      <div className="field full">
        <button
          className="btn btn-dark"
          disabled={busy}
          type="submit"
        >
          Submit trend
        </button>
      </div>
    </form>
  );
}

function TrendDetailView({
  trend,
  actions,
  canScore,
  onStatus,
  onVote,
  onScore,
  onCreateAction,
}: {
  trend: Trend;
  actions: ActionItem[];
  canScore: boolean;
  onStatus: (status: TrendStatus) => void;
  onVote: () => void;
  onScore: () => void;
  onCreateAction: () => void;
}) {
  return (
    <>
      <div className="chips" style={{ marginBottom: 11 }}>
        <span className="chip">{trend.category}</span>
        <span className="chip">{trend.momentum}</span>
        <span className="chip">
          {statusLabel(trend.boardStatus)}
        </span>
      </div>
      <div className="detail-layout">
        <div className="grid">
          <div className="detail-block">
            <h3>What’s happening</h3>
            <p>
              {trend.evidenceDescription ||
                trend.sourceUrl ||
                "No evidence description added."}
            </p>
          </div>
          <div className="detail-block">
            <h3>Why BrightNow should care</h3>
            <p>{trend.relevance}</p>
          </div>
          <div className="detail-block">
            <h3>Suggested next action</h3>
            <p>
              {trend.suggestedAction ||
                "No suggested action added."}
            </p>
          </div>
          <div className="detail-block">
            <h3>Linked actions</h3>
            {actions.map((action) => (
              <div className="linked-action" key={action.id}>
                <strong>{action.title}</strong>
                <span>
                  {action.accountableName} · {action.workPeriod} ·{" "}
                  {statusLabel(action.status)}
                </span>
              </div>
            ))}
            {!actions.length && <p>No linked actions yet.</p>}
          </div>
        </div>
        <div className="grid">
          <div className="detail-block">
            <h3>Trend Opportunity Score</h3>
            <div className="big-score">
              {trend.opportunityScore ?? "—"}
            </div>
            <p>
              Average of Curator/Admin scores. Squad votes do not
              change this number.
            </p>
            {canScore && (
              <button
                className="btn btn-light"
                style={{ width: "100%", marginTop: 9 }}
                onClick={onScore}
              >
                Edit my score
              </button>
            )}
            <button
              className={`vote ${
                trend.hasVoted ? "voted" : ""
              }`}
              style={{ width: "100%", marginTop: 7 }}
              onClick={onVote}
            >
              ▲ {trend.voteCount}{" "}
              {trend.hasVoted ? "Voted" : "Upvote"}
            </button>
          </div>
          <div className="detail-block">
            <h3>Board status</h3>
            <select
              className="status-select"
              value={trend.boardStatus}
              onChange={(event) =>
                onStatus(event.target.value as TrendStatus)
              }
            >
              {TREND_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 10 }}>
              {trend.statusHistory.slice(0, 3).map((history) => (
                <p key={history.id}>
                  {history.previousStatus
                    ? statusLabel(history.previousStatus)
                    : "Submitted"}{" "}
                  → {statusLabel(history.newStatus)} by{" "}
                  {history.changedByName} ·{" "}
                  {formatDate(history.createdAt)}
                </p>
              ))}
            </div>
          </div>
          <div className="detail-block">
            <h3>Submitted by</h3>
            <p>
              {trend.submittedByName} ·{" "}
              {trend.submittedByDivision} · {trend.platform}
            </p>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-dark" onClick={onCreateAction}>
          Turn into action
        </button>
      </div>
    </>
  );
}

function ScoreFormView({
  form,
  setForm,
  busy,
  onSubmit,
}: {
  form: TrendScoreInput;
  setForm: (value: TrendScoreInput) => void;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  const total = Math.round(
    SCORE_FIELDS.reduce(
      (sum, field) =>
        sum + (form[field.key] / 5) * field.weight,
      0,
    ),
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="info-block" style={{ marginBottom: 11 }}>
        <strong>Current total: {total}</strong>
        Each criterion is rated 1–5. Upvotes stay separate.
      </div>
      {SCORE_FIELDS.map((field) => (
        <div className="score-row" key={field.key}>
          <span>
            {field.label} ({field.weight}%)
          </span>
          <select
            value={form[field.key]}
            onChange={(event) =>
              setForm({
                ...form,
                [field.key]: Number(event.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <strong>
            {Math.round(
              (form[field.key] / 5) * field.weight,
            )}
          </strong>
        </div>
      ))}
      <div className="modal-actions">
        <button
          className="btn btn-dark"
          disabled={busy}
          type="submit"
        >
          Save score
        </button>
      </div>
    </form>
  );
}

function ActionFormView({
  form,
  setForm,
  trends,
  users,
  busy,
  onSubmit,
}: {
  form: ActionForm;
  setForm: (value: ActionForm) => void;
  trends: Trend[];
  users: AppUser[];
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="field full">
        <label>Action</label>
        <input
          required
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <label>Source trend</label>
        <select
          value={form.sourceTrendId}
          onChange={(event) =>
            setForm({
              ...form,
              sourceTrendId: event.target.value,
            })
          }
        >
          <option value="">
            Standalone action / not from a trend
          </option>
          {trends.map((trend) => (
            <option key={trend.id} value={trend.id}>
              {trend.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Accountable</label>
        <select
          required
          value={form.accountableUserId}
          onChange={(event) =>
            setForm({
              ...form,
              accountableUserId: event.target.value,
            })
          }
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} · {user.divisionName}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Work period</label>
        <input
          required
          value={form.workPeriod}
          onChange={(event) =>
            setForm({ ...form, workPeriod: event.target.value })
          }
          placeholder="e.g. Week 1 August"
        />
      </div>
      <div className="field full">
        <label>Status</label>
        <select
          value={form.status}
          onChange={(event) =>
            setForm({
              ...form,
              status: event.target.value as Exclude<
                ActionStatus,
                "done"
              >,
            })
          }
        >
          {ACTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="field full">
        <button
          className="btn btn-dark"
          disabled={busy}
          type="submit"
        >
          Save action
        </button>
      </div>
    </form>
  );
}

function LearningFormView({
  action,
  form,
  setForm,
  busy,
  onSubmit,
}: {
  action: ActionItem;
  form: LearningForm;
  setForm: (value: LearningForm) => void;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="info-block field full">
        <strong>Published immediately</strong>
        Completing “{action.title}” will publish this learning
        directly to the Learning Library.
      </div>
      <div className="field full">
        <label>Learning title</label>
        <input
          required
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <label>Result or KPI</label>
        <textarea
          required
          value={form.resultKpi}
          onChange={(event) =>
            setForm({ ...form, resultKpi: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <label>What worked</label>
        <textarea
          value={form.whatWorked}
          onChange={(event) =>
            setForm({ ...form, whatWorked: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <label>What didn’t work</label>
        <textarea
          value={form.whatDidntWork}
          onChange={(event) =>
            setForm({
              ...form,
              whatDidntWork: event.target.value,
            })
          }
        />
      </div>
      <div className="field full">
        <label>Why did it happen?</label>
        <textarea
          value={form.whyItHappened}
          onChange={(event) =>
            setForm({
              ...form,
              whyItHappened: event.target.value,
            })
          }
        />
      </div>
      <div className="field full">
        <label>Reusable principle</label>
        <textarea
          required
          value={form.reusablePrinciple}
          onChange={(event) =>
            setForm({
              ...form,
              reusablePrinciple: event.target.value,
            })
          }
        />
      </div>
      <div className="field full">
        <label>Evidence or output link</label>
        <input
          type="url"
          value={form.evidenceUrl}
          onChange={(event) =>
            setForm({ ...form, evidenceUrl: event.target.value })
          }
        />
      </div>
      <div className="field full">
        <button
          className="btn btn-dark"
          disabled={busy}
          type="submit"
        >
          Complete & publish
        </button>
      </div>
    </form>
  );
}

function LearningDetailView({
  learning,
}: {
  learning: Learning;
}) {
  const blocks = [
    ["Result / KPI", learning.resultKpi],
    ["What worked", learning.whatWorked || "Not specified."],
    [
      "What didn’t work",
      learning.whatDidntWork || "Not specified.",
    ],
    [
      "Why it happened",
      learning.whyItHappened || "Not specified.",
    ],
    ["Reusable principle", learning.reusablePrinciple],
  ];

  return (
    <div className="detail-layout">
      <div className="grid">
        {blocks.map(([title, value]) => (
          <div className="detail-block" key={title}>
            <h3>{title}</h3>
            <p>{value}</p>
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="detail-block">
          <h3>Source trend</h3>
          <p>{learning.sourceTrendTitle || "Standalone"}</p>
        </div>
        <div className="detail-block">
          <h3>Source action</h3>
          <p>{learning.sourceActionTitle}</p>
        </div>
        <div className="detail-block">
          <h3>Action owner</h3>
          <p>{learning.actionOwnerName}</p>
        </div>
        <div className="detail-block">
          <h3>Evidence</h3>
          <p>
            {learning.evidenceUrl ? (
              <a
                href={learning.evidenceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open evidence ↗
              </a>
            ) : (
              "No link added."
            )}
          </p>
        </div>
        <div className="detail-block">
          <h3>Published</h3>
          <p>{formatDate(learning.publishedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function UserEditFormView({
  form,
  setForm,
  divisions,
  busy,
  onSubmit,
}: {
  form: UserForm;
  setForm: (value: UserForm) => void;
  divisions: Division[];
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="field full">
        <label>Display name</label>
        <input
          required
          value={form.displayName}
          onChange={(event) =>
            setForm({
              ...form,
              displayName: event.target.value,
            })
          }
        />
      </div>
      <div className="field">
        <label>Division</label>
        <select
          value={form.divisionId}
          onChange={(event) =>
            setForm({
              ...form,
              divisionId: event.target.value,
            })
          }
        >
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Role</label>
        <select
          value={form.role}
          onChange={(event) =>
            setForm({
              ...form,
              role: event.target.value as UserRole,
              pin:
                event.target.value === "contributor"
                  ? ""
                  : form.pin,
            })
          }
        >
          <option value="contributor">Contributor</option>
          <option value="curator">Curator</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {form.role !== "contributor" && (
        <div className="field">
          <label>New PIN (optional)</label>
          <input
            inputMode="numeric"
            maxLength={4}
            value={form.pin}
            onChange={(event) =>
              setForm({
                ...form,
                pin: event.target.value.replace(/\D/g, ""),
              })
            }
            placeholder="Leave blank to keep current PIN"
          />
        </div>
      )}
      <div className="field">
        <label>Status</label>
        <select
          value={String(form.isActive)}
          onChange={(event) =>
            setForm({
              ...form,
              isActive: event.target.value === "true",
            })
          }
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="field full">
        <button
          className="btn btn-dark"
          disabled={busy}
          type="submit"
        >
          Save member
        </button>
      </div>
    </form>
  );
}
