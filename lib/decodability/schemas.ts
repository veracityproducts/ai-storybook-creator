// Schemas and types for decodable readers
import { z } from "zod"

export const StoryPageSchema = z.object({
  text: z.string().min(1),
  imagePrompt: z.string().min(1),
  // Optional ABC variant - allow empty string or single character:
  letter: z.string().max(1).optional(),
})

export const StorySchema = z.object({
  title: z.string().min(1),
  pages: z.array(StoryPageSchema).min(1),
  moral: z.string().min(1),
})

export const PhonicsConfigSchema = z.object({
  patternId: z.string(),
  graphemesAllowed: z.array(z.string()),
  approvedWords: z.array(z.string()),
  heartWords: z.array(z.string()).default([]),
  bannedWords: z.array(z.string()).default([]),
  maxSentencesPerPage: z.number().int().min(1).max(3).default(2),
  maxUniqueWords: z.number().int().min(1).optional(),
  allowedPunctuation: z.array(z.string()).default([".", "!", "?"]),
  properNounsPolicy: z.enum(["none", "limited", "full"]).default("none"),
  // Character name mappings for image prompts (story name -> image descriptor)
  characterMappings: z.record(z.string(), z.string()).optional(),
})

export type Story = z.infer<typeof StorySchema>
export type StoryPage = z.infer<typeof StoryPageSchema>
export type PhonicsConfig = z.infer<typeof PhonicsConfigSchema>

export const ValidationReportSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.string()),
  offendingWords: z.array(z.string()),
})
export type ValidationReport = z.infer<typeof ValidationReportSchema>

