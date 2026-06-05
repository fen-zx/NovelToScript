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

/** 创作类任务 — 中高温，创意性优先 */
export const creativeModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.7,
  maxTokens: 4096,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})

/** 生成类任务 — 高温，最大创意 */
export const generationModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.8,
  maxTokens: 8192,
  apiKey: env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: env.DEEPSEEK_BASE_URL,
  },
})
