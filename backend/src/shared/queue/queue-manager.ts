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
// 定时任务注册
// ═══════════════════════════════════════

/** 注册每日凌晨 3:00 清理过期文件（novels/temp 30天, exports 90天） */
export async function scheduleCleanupJob(): Promise<void> {
  // 移除旧的重复任务，创建新的
  const repeatables = await cleanupQueue.getRepeatableJobs()
  for (const job of repeatables) {
    await cleanupQueue.removeRepeatableByKey(job.key)
  }
  await cleanupQueue.add("daily-cleanup", {}, {
    repeat: { pattern: "0 3 * * *" },  // 每天凌晨 3 点
    jobId: "cleanup-daily",
  })
  console.log("[Queue] Cleanup job scheduled: daily at 03:00")
}

// ═══════════════════════════════════════
// 并发控制辅助
// ═══════════════════════════════════════

/** 检查 script-generation 队列是否已满 */
export async function isScriptGenQueueFull(): Promise<boolean> {
  const waiting = await scriptGenerationQueue.getWaitingCount()
  return waiting >= 3 // PRD: 最大排队 = 3
}
