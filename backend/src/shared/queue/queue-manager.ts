// BullMQ 队列管理器
import { Queue, Worker, type ConnectionOptions } from "bullmq"
import { redis } from "@/shared/cache/redis"
import { env } from "@/config/env"

const connection: ConnectionOptions = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || "6379", 10),
}

export { connection as redisConnection }

// ═══════════════════════════════════════
// 队列定义
// ═══════════════════════════════════════

/** 剧本生成队列 — 并发1, 排队上限3 */
export const scriptGenerationQueue = new Queue("script-generation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
})

/** 剧本润色队列 */
export const scriptPolishQueue = new Queue("script-polish", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { age: 3600 * 24 },
  },
})

/** PDF 导出队列 */
export const exportPdfQueue = new Queue("export-pdf", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600 * 24 },
  },
})

/** 文件清理队列 (Cron) */
export const cleanupQueue = new Queue("cleanup", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 3600 * 24 },
  },
})

// ═══════════════════════════════════════
// 并发控制辅助
// ═══════════════════════════════════════

/** 检查 script-generation 队列是否已满 */
export async function isScriptGenQueueFull(): Promise<boolean> {
  const waiting = await scriptGenerationQueue.getWaitingCount()
  return waiting >= 3 // PRD: 最大排队 = 3
}
