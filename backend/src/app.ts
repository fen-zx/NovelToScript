// Express 应用配置
import express from "express"
import { corsConfig } from "@/config/cors"
import { errorHandler } from "@/middleware/error.middleware"
import { authMiddleware } from "@/middleware/auth.middleware"
import type { AuthRequest } from "@/middleware/auth.middleware"
import { subscribeTaskEvents } from "@/shared/queue/sse-pubsub"
import authRoutes from "@/modules/auth/auth.routes"
import novelRoutes from "@/modules/novel/novel.routes"
import taskRoutes from "@/modules/task/task.routes"
import scriptRoutes from "@/modules/script/script.routes"
import schemaRoutes from "@/modules/script/schema.routes"

export function createApp() {
  const app = express()

  // 全局中间件
  app.use(corsConfig)
  app.use(express.json({ limit: "1mb" }))

  // 请求日志
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })

  // ── SSE 实时推送 (A5) — 必须在 taskRoutes 之前注册 ──
  app.get("/api/tasks/:id/stream", authMiddleware, (req: AuthRequest, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    })

    const taskId = req.params.id as string
    const userId = req.userId

    // 发送连接成功事件
    res.write(`event: connected\ndata: ${JSON.stringify({ taskId, userId })}\n\n`)

    // 订阅 Redis Pub/Sub，将 Worker 事件转发给 SSE 客户端
    const unsubscribe = subscribeTaskEvents(taskId, (event) => {
      // 根据事件类型写入对应 SSE 事件
      const eventType = event.type // e.g. "agent:start", "agent:done", "task:complete"
      const payload = {
        agent: event.agent,
        message: event.message,
        summary: event.summary,
        error: event.error,
        percent: event.percent,
        scriptId: event.scriptId,
      }
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`)
    })

    // 客户端断开时取消订阅
    req.on("close", () => {
      unsubscribe()
    })
  })

  // ── API 路由 ──
  app.use("/api/auth", authRoutes)
  app.use("/api/novels", novelRoutes)
  app.use("/api/tasks", taskRoutes)
  app.use("/api/scripts", scriptRoutes)
  app.use("/api/schema", schemaRoutes)

  // ── 健康检查 ──
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  })

  // ── 错误处理 ──
  app.use(errorHandler)

  return app
}
