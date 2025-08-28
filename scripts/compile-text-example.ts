// Example script: compile decodable story text using stub clients
// Run with ts-node or compile to JS

import { compileStoryText } from "@/lib/pipeline/text/compile"
import { StubAIClient } from "@/lib/pipeline/text/clients/aiClient.stub"
import { StubDBClient } from "@/lib/pipeline/text/clients/dbClient.stub"

async function main() {
  const ai = new StubAIClient()
  const db = new StubDBClient()
  const result = await compileStoryText(ai, db, {
    title: "Make a Cake",
    theme: "Sam and Emma bake a cake together",
    patternId: "cvce-long-a",
    pageCount: 3,
  })
  console.log(JSON.stringify(result, null, 2))
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

