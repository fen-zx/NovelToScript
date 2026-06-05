// Plot Analysis Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel } from "@/config/deepseek"
import { PLOT_ANALYSIS_PROMPT } from "@/modules/ai/prompts/plot-analysis.prompt"

const prompt = PromptTemplate.fromTemplate(PLOT_ANALYSIS_PROMPT)

export const PlotAnalysisChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
])
