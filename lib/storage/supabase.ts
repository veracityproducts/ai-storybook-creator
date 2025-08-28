// Supabase Storage adapter for uploading generated images
// Requires: npm install @supabase/supabase-js
// IMPORTANT: Use the Service Role key ONLY on the server.

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || "storybook") as string

function getSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars")
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
}

export type UploadResult = {
  path: string
  url: string // public URL or signed URL depending on bucket visibility
}

export async function uploadBase64Image(
  base64: string,
  mimeType: string,
  path: string,
  opts?: { upsert?: boolean; makePublic?: boolean; signedUrlSeconds?: number }
): Promise<UploadResult> {
  const supabase = getSupabaseServerClient()
  const buffer = Buffer.from(base64, "base64")

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: opts?.upsert ?? true })
  if (error) throw error

  // Resolve a usable URL
  if (opts?.makePublic) {
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path)
    return { path, url: data.publicUrl }
  }

  // If bucket is already public, getPublicUrl still works
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path)
  if (data?.publicUrl) return { path, url: data.publicUrl }

  // Otherwise fall back to signed URL
  const seconds = opts?.signedUrlSeconds ?? 60 * 60 * 24 // 24h
  const signed = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(path, seconds)
  if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("Failed to create signed URL")
  return { path, url: signed.data.signedUrl }
}

export function buildImagePath(storyId: string, pageIndex: number, ext: string = "jpg") {
  const idx = String(pageIndex).padStart(2, "0")
  return `stories/${storyId}/page-${idx}.${ext}`
}

export function buildVariantImagePath(storyId: string, pageIndex: number, variantIndex: number, ext: string = "jpg") {
  const idx = String(pageIndex).padStart(2, "0")
  return `stories/${storyId}/page-${idx}-v${variantIndex}.${ext}`
}

