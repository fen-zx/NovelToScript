// Redis 连接管理
import Redis from "ioredis"
import { env } from "@/config/env"

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,  // BullMQ 强制要求
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000)
    return delay
  },
  lazyConnect: true,
})

redis.on("connect", () => console.log("[Redis] Connected"))
redis.on("error", (err) => console.error("[Redis] Error:", err.message))

export async function connectRedis(): Promise<void> {
  await redis.connect()
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit()
}
