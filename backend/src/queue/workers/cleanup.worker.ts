// Cleanup Worker — 定期清理过期文件
import { Worker } from "bullmq"
import { redis } from "@/shared/cache/redis"
import { minioClient } from "@/shared/storage/minio"
import { logger } from "@/utils/logger"

const RETENTION: Record<string, number> = {
  novels: 30,   // 天
  temp: 30,
  exports: 90,
}

export const cleanupWorker = new Worker(
  "cleanup",
  async () => {
    const now = Date.now()
    let deletedCount = 0
    let freedBytes = 0

    for (const [bucket, days] of Object.entries(RETENTION)) {
      const objects = await minioClient.listObjects(bucket, "", true)
      for await (const obj of objects) {
        const age = now - obj.lastModified.getTime()
        if (age > days * 86400_000) {
          await minioClient.removeObject(bucket, obj.name)
          deletedCount++
          freedBytes += obj.size || 0
          logger.info(`[Cleanup] Deleted ${bucket}/${obj.name} (${days}d old)`)
        }
      }
    }

    logger.info(`[Cleanup] Done: ${deletedCount} files, ${(freedBytes / 1024 / 1024).toFixed(1)}MB freed`)
    return { deletedCount, freedBytes }
  },
  { connection: redis, concurrency: 1, lockDuration: 300_000 },
)
