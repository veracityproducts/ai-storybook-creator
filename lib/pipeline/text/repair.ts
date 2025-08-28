import type { AIClient, RepairStrategy, RuleConfig, Story, Violation } from "./types"
import { validatePage } from "./rules"

export async function repairPage(
  ai: AIClient,
  text: string,
  violations: Violation[],
  allowedWords: string[],
  rules: RuleConfig,
  strategy: RepairStrategy
): Promise<string> {
  // For now delegate to AI client strategy (prompt handled there)
  return ai.repairPage({ originalText: text, violations, allowedWords, rules, strategy })
}

export async function repairStory(
  ai: AIClient,
  story: Story,
  allowedWords: string[],
  rules: RuleConfig,
  maxAttemptsPerPage = 2
): Promise<{ story: Story; report: Array<{ pageIndex: number; attempts: number; violations: Violation[] }> }> {
  const copy: Story = { ...story, pages: story.pages.map(p => ({ ...p })) }
  const report: Array<{ pageIndex: number; attempts: number; violations: Violation[] }> = []

  for (const page of copy.pages) {
    let attempts = 0
    let violations = validatePage(page.text, rules, page.index)
    while (violations.length > 0 && attempts < maxAttemptsPerPage) {
      const strategy: RepairStrategy = attempts === 0 ? "minimal" : "rewrite"
      page.text = await repairPage(ai, page.text, violations, allowedWords, rules, strategy)
      attempts++
      violations = validatePage(page.text, rules, page.index)
    }
    report.push({ pageIndex: page.index, attempts, violations })
  }

  return { story: copy, report }
}

