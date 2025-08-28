// Types for the decodable story text pipeline

export type PatternId = string

export type Story = {
  title: string
  theme: string
  patternId: PatternId
  pages: Array<Page>
}

export type Page = {
  index: number
  text: string
}

export type RuleConfig = {
  allowedWords: Set<string>
  allowedPunctuation: Set<string>
  disallowProperNouns: boolean
  contractionsAllowed: boolean
  morphology: {
    plural_s: boolean
    past_ed: boolean
    gerund_ing: boolean
  }
  sentenceLengthBounds: { min: number; max: number }
  maxSentencesPerPage: number
  properNounsWhitelist?: Set<string>
}

export type ViolationReason =
  | "out_of_scope"
  | "morphology"
  | "punctuation"
  | "capitalization"
  | "length"
  | "structure"

export type Violation = {
  pageIndex: number
  token: string
  reason: ViolationReason
  span?: [number, number]
  note?: string
}

export type DraftOptions = {
  pageCount: number
  maxSentencesPerPage?: number
  sentenceLengthBounds?: { min: number; max: number }
  whitelist?: string[]
}

export type RepairStrategy = "minimal" | "rewrite"

export type CompileReport = {
  pageIndex: number
  attempts: number
  violations: Violation[]
}

export type CompileResult = {
  story: Story
  report: CompileReport[]
}

export interface AIClient {
  outline(input: {
    title: string
    theme: string
    patternId: PatternId
    pageCount: number
    sampleAllowed: string[]
  }): Promise<string[]>

  draftPage(input: {
    outlineBullet: string
    allowedWords: string[]
    rules: RuleConfig
  }): Promise<string>

  repairPage(input: {
    originalText: string
    violations: Violation[]
    allowedWords: string[]
    rules: RuleConfig
    strategy: RepairStrategy
  }): Promise<string>
}

export interface DBClient {
  getApprovedWords(patternId: PatternId): Promise<string[]>
  getRuleConfig(patternId: PatternId): Promise<Partial<RuleConfig> | null>
}

