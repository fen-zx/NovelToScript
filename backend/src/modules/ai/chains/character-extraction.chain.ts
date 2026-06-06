// Character Extraction Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel } from "@/config/deepseek"
import { CHARACTER_EXTRACTION_PROMPT } from "@/modules/ai/prompts/character-extraction.prompt"

const prompt = PromptTemplate.fromTemplate(CHARACTER_EXTRACTION_PROMPT)

export const CharacterExtractionChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
])
