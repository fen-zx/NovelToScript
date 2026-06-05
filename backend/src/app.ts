// Express 应用配置
import express from "express"
import { corsConfig } from "@/config/cors"
import { errorHandler } from "@/middleware/error.middleware"
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

  // ── API 路由 ──
  app.use("/api/auth", authRoutes)
  app.use("/api/novels", novelRoutes)
  app.use("/api/tasks", taskRoutes)
  app.use("/api/scripts", scriptRoutes)
  app.use("/api/schema", schemaRoutes)

  // ── SSE 实时推送 (A5) ──
  app.get("/api/tasks/:id/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })

    const taskId = req.params.id
    // [TODO] Redis Pub/Sub 订阅 task:{taskId}:events
    res.write(`data: ${JSON.stringify({ event: "connected", taskId })}\n\n`)

    req.on("close", () => {
      // [TODO] 取消 Redis 订阅
    })
  })

  // ── 健康检查 ──
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  })

  // ── 错误处理 ──
  app.use(errorHandler)

  return app
}
