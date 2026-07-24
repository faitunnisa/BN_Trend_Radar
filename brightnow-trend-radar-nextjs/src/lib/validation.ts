import { z } from "zod";

export const roleSchema = z.enum(["contributor", "curator", "admin"]);
export const trendStatusSchema = z.enum([
  "validate",
  "watchlist",
  "ready",
  "activated",
  "archived",
]);
export const actionStatusSchema = z.enum([
  "planned",
  "in_progress",
  "needs_review",
  "done",
]);

export const selectProfileSchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/).optional(),
});

export const trendCreateSchema = z.object({
  submissionWeek: z.string().min(2).max(40),
  title: z.string().min(3).max(180),
  category: z.string().min(2).max(80),
  platform: z.string().min(2).max(80),
  momentum: z.string().min(2).max(50),
  sourceUrl: z.string().url().or(z.literal("")).optional(),
  evidenceDescription: z.string().max(1200).optional(),
  relevance: z.string().min(3).max(3000),
  suggestedAction: z.string().max(3000).optional(),
  boardStatus: trendStatusSchema,
});

export const scoreSchema = z.object({
  momentum: z.number().int().min(1).max(5),
  genZRelevance: z.number().int().min(1).max(5),
  brightNowRelevance: z.number().int().min(1).max(5),
  adaptability: z.number().int().min(1).max(5),
  speedRequired: z.number().int().min(1).max(5),
  businessPotential: z.number().int().min(1).max(5),
  feasibility: z.number().int().min(1).max(5),
});

export const actionInputSchema = z.object({
  workspaceWeek: z.string().min(2).max(40),
  sourceTrendId: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(300),
  accountableUserId: z.string().uuid(),
  workPeriod: z.string().min(2).max(120),
  status: z.enum(["planned", "in_progress", "needs_review"]),
});

export const learningSchema = z.object({
  title: z.string().min(3).max(250),
  resultKpi: z.string().min(3).max(3000),
  whatWorked: z.string().max(3000).optional(),
  whatDidntWork: z.string().max(3000).optional(),
  whyItHappened: z.string().max(3000).optional(),
  reusablePrinciple: z.string().min(3).max(3000),
  evidenceUrl: z.string().url().or(z.literal("")).optional(),
});

export const userCreateSchema = z.object({
  displayName: z.string().min(2).max(100),
  divisionId: z.string().uuid().nullable(),
  role: roleSchema,
  pin: z.string().regex(/^\d{4}$/).optional(),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(2).max(100),
  divisionId: z.string().uuid().nullable(),
  role: roleSchema,
  pin: z.string().regex(/^\d{4}$/).optional(),
  isActive: z.boolean(),
});

export const divisionSchema = z.object({
  name: z.string().min(2).max(100),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(100),
});
