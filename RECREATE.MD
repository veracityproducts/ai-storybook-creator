# RECREATE: Minimal ABC Book Generator (Text + Images)

This guide extracts the minimal, portable logic needed to generate a children’s ABC “book”:
- Generate structured story content (title, pages[], moral) with Gemini via the AI SDK
- Generate an illustration per page (with style consistency)
- Persist progress and results via simple storage functions you can re‑implement

You can plug this into your own web framework, queue, and storage (DB + object store).

## What you’ll build

- A function `generateStoryInBackground(id, title, prompt, ageRange)` that:
  1) Calls Gemini to produce structured JSON (pages + moral)
  2) Persists the story JSON
  3) Iterates pages to generate + upload images, persisting progress
  4) Marks the story complete

## Dependencies

- Node 18+
- TypeScript (optional but recommended)
- AI SDK + Google provider:
  - `npm install ai @ai-sdk/google`
- Your storage (DB + blob). Examples below assume you’ll implement adapters.

## Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini key
- For your storage, add what’s needed (e.g., S3 creds)

## Data Model

```ts
// Types you can adapt for your DB
export type StoryPage = { text: string; imagePrompt: string }
export type StoryContent = { title: string; pages: StoryPage[]; moral?: string }
export type StoryStatus = "generating" | "generating_story" | "generating_images" | "complete" | "failed"

export type StoryRecord = {
  id: string
  title: string
  prompt: string
  age: string
  status: StoryStatus
  visibility?: "public" | "unlisted"
  storyContent?: StoryContent | string // store as JSON or JSON-string; your choice
  images?: string[] | string // URLs for page images; your choice
  createdAt: string
  completedAt?: string
  error?: string
}
```

## Alphabet Helpers

```ts
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
export const getAlphabetSubset = (count = 8) => ALPHABET.slice(0, count).split("")
```

## Adapters (you implement these)

```ts
// DB adapter — implement with your DB
export interface StoryDB {
  createStory(partial: Partial<StoryRecord>): Promise<void>
  updateStory(id: string, partial: Partial<StoryRecord>): Promise<void>
  getStory(id: string): Promise<StoryRecord | null>
}

// Blob adapter — implement with your object storage
export interface BlobStore {
  uploadBase64Image(base64DataUrl: string, path: string): Promise<string> // returns public URL
}
```

## Image Consistency Context (optional but recommended)

```ts
function buildImageMessages(priorImages: string[], priorPrompts: string[], nextPrompt: string) {
  // You can encode prior context as system/user messages
  // For simplicity we just return an empty array here.
  return [] as { role: "system" | "user" | "assistant"; content: string }[]
}
```

## Core: Image Generation

```ts
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function generateImage(
  prompt: string,
  storyId: string,
  pageIndex: number,
  priorImages: string[],
  priorPrompts: string[],
  blob: BlobStore,
): Promise<string> {
  const messages = buildImageMessages(priorImages, priorPrompts, prompt)

  const result = await generateText({
    model: google("gemini-2.0-flash-exp"),
    providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
    messages: messages.length ? messages : undefined,
    prompt: messages.length ? undefined : `Generate an illustration for a children's ABC story: ${prompt}. Make it colorful, child-friendly, and inclusive.`,
  })

  if (Array.isArray(result.files)) {
    for (const file of result.files) {
      if (file.mimeType?.startsWith("image/") && file.base64) {
        const dataUrl = `data:${file.mimeType};base64,${file.base64}`
        const url = await blob.uploadBase64Image(dataUrl, `${storyId}/page-${pageIndex}.png`)
        if (url?.startsWith("http")) return url
      }
    }
  }
  return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(prompt.slice(0, 30))}`
}
```

## Core: Story Generation Orchestrator

```ts
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"

// Schema enforcement with your validator of choice (Zod used originally)
// Here we lean on generateObject’s schema capability if available in your setup.

export async function generateStoryInBackground(
  db: StoryDB,
  blob: BlobStore,
  storyId: string,
  title: string,
  prompt: string,
  ageRange: string,
  lettersCount = 8,
) {
  try {
    await db.updateStory(storyId, { status: "generating_story" })

    const alphabetLetters = getAlphabetSubset(lettersCount)

    // 1) Generate structured story content
    const generatedStory = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: {
        pages: [{ letter: "string", text: "string", imagePrompt: "string" }],
        moral: "string",
      } as any,
      prompt: `Create a children's ABC content titled "${title}" for ages ${ageRange} about: ${prompt}.
The content MUST center on the title. Progress through the first ${lettersCount} letters: ${alphabetLetters.join(", ")}.
Each page begins with its letter, stays on theme, and is age-appropriate.
Include a moral. Provide a detailed imagePrompt per page for consistent illustration.`,
      system: `You are a children's ABC content creator. Produce engaging, educational content with consistent characters and plot when appropriate.`,
    })

    const storyContent: StoryContent = {
      title,
      pages: (generatedStory as any).object?.pages?.map((p: any) => ({ text: p.text, imagePrompt: p.imagePrompt })) ?? [],
      moral: (generatedStory as any).object?.moral || "Learning the alphabet is fun and helps us discover new words!",
    }

    await db.updateStory(storyId, { status: "generating_images", storyContent })

    // 2) Generate images iteratively with style consistency
    const images: string[] = []
    const priorImages: string[] = []
    const priorPrompts: string[] = []

    for (let i = 0; i < storyContent.pages.length; i++) {
      const imagePrompt = storyContent.pages[i].imagePrompt
      try {
        const url = await generateImage(imagePrompt, storyId, i, priorImages, priorPrompts, blob)
        images.push(url)
        if (!url.includes("/placeholder.svg")) {
          priorImages.push(url)
          priorPrompts.push(imagePrompt)
        }
        await db.updateStory(storyId, { images })
      } catch (e) {
        images.push(`/placeholder.svg?height=400&width=600&text=Letter+${alphabetLetters[i]}`)
        await db.updateStory(storyId, { images })
      }
    }

    await db.updateStory(storyId, { status: "complete", images, completedAt: new Date().toISOString() })
  } catch (error: any) {
    await db.updateStory(storyId, { status: "failed", error: error?.message || "Unknown error" })
    throw error
  }
}
```

## Example: Minimal Usage (script outline)

```ts
import crypto from "node:crypto"

async function main(db: StoryDB, blob: BlobStore) {
  const id = crypto.randomUUID()
  const title = "Max's Alphabet Adventure"
  const prompt = "A kind kid exploring a magical forest and making new friends"
  const age = "3-8"

  // Create a shell record; adjust fields to your DB
  await db.createStory({
    id,
    title,
    prompt,
    age,
    status: "generating",
    createdAt: new Date().toISOString(),
  })

  // Kick off generation (await here, or queue/cron in your system)
  await generateStoryInBackground(db, blob, id, title, prompt, age, 8)

  console.log("Done:", await db.getStory(id))
}
```

## Notes, Pitfalls, and Tips

- Persist JSON as native JSON in your DB. If you use a KV/Redis-like store that prefers strings, stringify on write and parse on read consistently.
- Image consistency: The provided `buildImageMessages` is a placeholder. For better consistency, feed prior image URLs and prompts back to the model as context.
- Retries: Add retry/backoff around model calls and uploads.
- Concurrency: If you fan out image generation, throttle to respect model limits.
- Output formats: You can print-to-PDF in the browser, or later add server-side PDF/EPUB generation.

## What was removed vs original app

- Next.js specific UI, Server Actions, and KV/Blob integrations
- Async param handling and cookies nuances (Next.js 15)
- Admin/cron routes

This RECREATE focuses purely on the core job: generate structured text + consistent images, persist progress, and finish with a usable book payload you can render anywhere.

