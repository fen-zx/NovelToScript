// Scene Planning Chain
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { creativeModel } from "@/config/deepseek"
import { SCENE_PLANNING_PROMPT } from "@/modules/ai/prompts/scene-planning.prompt"

const prompt = PromptTemplate.fromTemplate(SCENE_PLANNING_PROMPT)

export const ScenePlanningChain = RunnableSequence.from([
  prompt,
  creativeModel,
  new StringOutputParser(),
])
