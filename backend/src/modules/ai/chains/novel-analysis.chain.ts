// Novel Analysis Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel } from "@/config/deepseek"
import { NOVEL_ANALYSIS_PROMPT } from "@/modules/ai/prompts/novel-analysis.prompt"

const prompt = PromptTemplate.fromTemplate(NOVEL_ANALYSIS_PROMPT)

export const NovelAnalysisChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
])
