// YAML Validation Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel } from "@/config/deepseek"
import { YAML_VALIDATION_PROMPT } from "@/modules/ai/prompts/yaml-validation.prompt"

const prompt = PromptTemplate.fromTemplate(YAML_VALIDATION_PROMPT)

export const YamlValidationChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
])
