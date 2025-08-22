// Generation helpers using ai-sdk/google
import { google } from "@ai-sdk/google"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import fs from "node:fs/promises"
import path from "node:path"
import { PhonicsConfig, Story, StorySchema } from "./schemas"

export async function loadPrompt(name: string): Promise<string> {
  const p = path.join(process.cwd(), "prompts", name)
  return await fs.readFile(p, "utf8")
}

// Helper to replace character names with detailed descriptors for image prompts
// This ensures character consistency by using the exact same detailed description
// from the Style Bible in every image prompt
function replaceCharacterNames(text: string, characterMappings?: Record<string, string>): string {
  if (!characterMappings) return text

  let result = text
  for (const [characterName, detailedDescriptor] of Object.entries(characterMappings)) {
    // Replace character name with detailed descriptor (case-insensitive, word boundaries)
    const regex = new RegExp(`\\b${characterName}\\b`, 'gi')
    result = result.replace(regex, detailedDescriptor)
  }
  return result
}

export async function generateStyleBible(title: string, theme: string) {
  const system = await loadPrompt("system.md")
  const prompt = (await loadPrompt("style-bible.md"))
    .replaceAll("${title}", title)
    .replaceAll("${theme}", theme)

  const res = await generateText({ model: google("gemini-2.0-flash-lite"), system, prompt })
  return res.text.trim()
}

export async function generateStoryJSON(cfg: PhonicsConfig & { title: string; theme: string; ageRange: string }) {
  const system = await loadPrompt("system.md")
  const prompt = (await loadPrompt("story-json.md"))
    .replaceAll("${title}", cfg.title)
    .replaceAll("${ageRange}", cfg.ageRange)
    .replaceAll("${theme}", cfg.theme)
    .replaceAll("${graphemesAllowed}", JSON.stringify(cfg.graphemesAllowed))
    .replaceAll("${maxSentencesPerPage}", String(cfg.maxSentencesPerPage))
    .replaceAll("${allowedPunctuation}", JSON.stringify(cfg.allowedPunctuation))
    .replaceAll("${properNounsPolicy}", cfg.properNounsPolicy)
    .replaceAll("${approvedWords}", JSON.stringify(cfg.approvedWords))
    .replaceAll("${heartWords}", JSON.stringify(cfg.heartWords))
    .replaceAll("${bannedWords}", JSON.stringify(cfg.bannedWords))

  const result = await generateObject({
    model: google("gemini-2.0-flash-lite"),
    system,
    prompt,
    schema: StorySchema,
  })
  return result.object as Story
}

export async function repairStoryJSON(invalidStory: unknown, cfg: PhonicsConfig, offendingWords: string[]) {
  const system = await loadPrompt("system.md")
  const prompt = (await loadPrompt("guardrail-repair.md"))
    .replaceAll("[STORY_JSON]", JSON.stringify(invalidStory))
    .replaceAll("${offendingWords}", JSON.stringify(offendingWords))
    .replaceAll("${approvedWords}", JSON.stringify(cfg.approvedWords))
    .replaceAll("${heartWords}", JSON.stringify(cfg.heartWords))
    .replaceAll("${bannedWords}", JSON.stringify(cfg.bannedWords))

  const result = await generateObject({
    model: google("gemini-2.0-flash-lite"),
    system,
    prompt,
    schema: StorySchema,
  })
  return result.object as Story
}

export async function generatePageImagePrompt(
  styleBible: string,
  pageText: string,
  imageSystemTokens: string,
  characterMappings?: Record<string, string>
) {
  const prompt = (await loadPrompt("image-page.md"))
    .replaceAll("[STYLE_BIBLE]", styleBible)
    .replaceAll("[IMAGE_SYSTEM_TOKENS]", imageSystemTokens)
    .replaceAll("${text}", pageText)

  const res = await generateText({ model: google("gemini-2.0-flash-lite"), prompt })
  const imagePrompt = res.text.trim().split("\n")[0]

  // Replace character names with generic descriptors for image generation
  return replaceCharacterNames(imagePrompt, characterMappings)
}

export async function generateStyleTokens(styleBible: string) {
  const prompt = (await loadPrompt("style-tokens.md"))
    .replaceAll("[STYLE_BIBLE]", styleBible)
  const res = await generateText({ model: google("gemini-2.0-flash-lite"), prompt })
  return res.text.trim().split("\n")[0]
}

export async function loadImageSystemTokens(): Promise<string> {
  return (await loadPrompt("image-system-tokens.md")).split("\n").filter(Boolean).join(" ")
}

