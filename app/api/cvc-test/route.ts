import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import {
  generateStyleBible,
  generateStyleTokens,
  loadImageSystemTokens,
  generatePageImagePrompt,
  generateStoryJSON,
  repairStoryJSON,
} from "@/lib/decodability/generation"
import { validateStoryDecodability } from "@/lib/decodability/validate"
import type { PhonicsConfig } from "@/lib/decodability/schemas"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    
    // CVC phonics configuration
    const cvcConfig: PhonicsConfig = {
      patternId: "cvc-short-a",
      graphemesAllowed: ["a", "m", "s", "t", "p", "n", "c", "d"],
      approvedWords: [
        "am", "an", "at", "as", 
        "sap", "sat", "tap", "map", "nap", "cap", "can", 
        "mad", "sad", "tan", "pan", "cat", "mat", "man", "pat", "and", "sand"
      ],
      heartWords: ["the", "I", "to", "a"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "none",
    }

    const title = body.title || "Sam at Camp"
    const theme = body.theme || "Sam sets up a mat and a tent at camp"
    const ageRange = body.ageRange || "4-7"
    const storyId = body.storyId || nanoid(10)

    // 1) Generate Style Bible and tokens
    const styleBible = await generateStyleBible(title, theme)
    const styleTokens = await generateStyleTokens(styleBible)
    const systemTokens = await loadImageSystemTokens()

    // 2) Generate decodable story JSON
    let story = await generateStoryJSON({
      ...cvcConfig,
      title,
      theme,
      ageRange,
    })

    // 3) Validate decodability
    let validationReport = validateStoryDecodability(story, cvcConfig)
    let repairAttempts = 0
    const maxRepairAttempts = 3

    // 4) Repair if needed
    while (!validationReport.valid && repairAttempts < maxRepairAttempts) {
      repairAttempts++
      story = await repairStoryJSON(story, cvcConfig, validationReport.offendingWords)
      validationReport = validateStoryDecodability(story, cvcConfig)
    }

    // 5) Generate image prompts (but not actual images for this test)
    const imagePrompts = []
    for (let i = 0; i < Math.min(story.pages.length, 3); i++) {
      const page = story.pages[i]
      const pageBody = await generatePageImagePrompt(styleBible, page.text, systemTokens)
      const finalPrompt = `${pageBody} ${styleTokens} ${systemTokens}`.trim()

      imagePrompts.push({
        pageIndex: i,
        text: page.text,
        pageBody,
        finalPrompt,
      })
    }

    return NextResponse.json({
      ok: true,
      title,
      theme,
      ageRange,
      storyId,
      cvcConfig,
      styleBible,
      styleTokens,
      systemTokens,
      story: {
        title: story.title,
        pages: story.pages.slice(0, 3), // Only first 3 pages
        moral: story.moral,
      },
      validationReport,
      repairAttempts,
      imagePrompts,
    })
  } catch (err: any) {
    console.error("/api/cvc-test error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}
