// Script Polish Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { creativeModel } from "@/config/deepseek"
import { POLISH_PROMPT } from "@/modules/ai/prompts/polish.prompt"

const prompt = PromptTemplate.fromTemplate(POLISH_PROMPT)

export const ScriptPolishChain = RunnableSequence.from([
  prompt,
  creativeModel,
  new StringOutputParser(),
])
