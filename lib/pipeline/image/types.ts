// Types for the image pipeline (modular, DI-friendly)

export type ImageVariant = { base64: string; mimeType?: string }

export type PageImageResult = {
  variants: ImageVariant[]
  urls: string[]
  pickedVariantIndex: number
  qaScores: any[]
  qaRaw?: string[]
  chosenUrl: string
  chosenMimeType: string
  chosenBase64: string
  variantCount: number
}

export type CompilePageInput = {
  storyId: string
  pageIndex: number
  finalPrompt: string
  imageOptions: any
  castNames: string[]
  wardrobeSummary: string
  actionText?: string
  desiredMinVariants?: number // e.g., 3 for seated pages
}

