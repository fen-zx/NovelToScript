// 应用入口
import { createApp } from "./app"
import { connectDB, disconnectDB } from "@/shared/database/prisma"
import { connectRedis, disconnectRedis } from "@/shared/cache/redis"
import { initBuckets } from "@/shared/storage/minio"
import { env } from "@/config/env"
import { logger } from "@/utils/logger"

async function bootstrap() {
  // 初始化基础设施
  logger.info("Starting server...")
  await connectDB()
  await connectRedis()
  await initBuckets()

  // 启动 BullMQ Workers（异步，不阻塞 API）
  import("@/queue/workers/index").then(() => {
    logger.info("[Worker] All workers started")
  }).catch(err => {
    logger.error("[Worker] Failed to start:", err)
  })

  const app = createApp()

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`)
    logger.info(`Mode: ${env.NODE_ENV}`)
  })

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    server.close(async () => {
      await disconnectDB()
      await disconnectRedis()
      logger.info("Server stopped")
      process.exit(0)
    })
    // 强制退出超时
    setTimeout(() => process.exit(1), 10_000)
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
}

bootstrap().catch((err) => {
  logger.error("Fatal: Failed to start", err)
  process.exit(1)
})
