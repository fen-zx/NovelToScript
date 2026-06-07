// DeepSeek API 配置
import { ChatDeepSeek } from "@langchain/deepseek"
import { env } from "./env"

/** 分析类任务 — 低温，准确性优先 */
export const analysisModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.3,
  maxTokens: 2048,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})

/** 创作类任务 — 中低温，平衡创意与忠实度 */
export const creativeModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.4,
  maxTokens: 4096,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})

/** 生成类任务 — 中温，有限创意但忠于原文 */
export const generationModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.5,
  maxTokens: 8192,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})

/** 润色类任务 — 低温高容量，确保完整输出不截断 */
export const polishModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.3,
  maxTokens: 16384,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})
