import type { AIClient, DBClient, DraftOptions, CompileResult, Story } from "./types"
import { getApprovedWordsCached, getRuleConfigCached } from "./wordbank"
import { defaultRuleConfig, validateStory } from "./rules"
import { draftStory } from "./author"
import { repairStory } from "./repair"

export async function compileStoryText(
  ai: AIClient,
  db: DBClient,
  opts: { title: string; theme: string; patternId: string } & DraftOptions,
  maxAttemptsPerPage = 2
): Promise<CompileResult> {
  const rulesPartial = await getRuleConfigCached(db, opts.patternId)
  const allowedWords = await getApprovedWordsCached(db, opts.patternId)
  const rules = { ...defaultRuleConfig(), ...rulesPartial, allowedWords: new Set(allowedWords) }

  // Draft outline + pages
  let story: Story = await draftStory(ai, opts, allowedWords)

  // Validate; if violations, repair
  const firstViolations = validateStory(story, rules)
  if (firstViolations.length === 0) {
    return { story, report: story.pages.map(p => ({ pageIndex: p.index, attempts: 0, violations: [] })) }
  }

  const { story: repaired, report } = await repairStory(ai, story, allowedWords, rules, maxAttemptsPerPage)
  return { story: repaired, report }
}

