// Script Generation Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { generationModel } from "@/config/deepseek"
import { SCRIPT_GENERATION_PROMPT } from "@/modules/ai/prompts/script-generation.prompt"

const prompt = PromptTemplate.fromTemplate(SCRIPT_GENERATION_PROMPT)

export const ScriptGenerationChain = RunnableSequence.from([
  prompt,
  generationModel,
  new StringOutputParser(),
])
