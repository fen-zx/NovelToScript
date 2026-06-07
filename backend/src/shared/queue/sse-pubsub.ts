// SSE 事件发布/订阅 — 基于 Redis Pub/Sub
// Worker 进程发布事件 → 主进程 SSE Handler 订阅转发给前端

import { redis } from "@/shared/cache/redis"

const CHANNEL_PREFIX = "task:events:"

export interface TaskEvent {
  type: "agent:start" | "agent:done" | "agent:error" | "task:complete" | "task:failed"
  taskId: string
  agent?: string
  message?: string
  summary?: string
  error?: string
  percent?: number
  scriptId?: string
}

/** 向 Redis 发布任务事件（由 Worker 调用） */
export async function publishTaskEvent(event: TaskEvent): Promise<void> {
  await redis.publish(CHANNEL_PREFIX + event.taskId, JSON.stringify(event))
}

/** 订阅 Redis 任务事件（由 SSE Handler 调用），返回取消订阅函数 */
export function subscribeTaskEvents(
  taskId: string,
  onEvent: (event: TaskEvent) => void,
): () => void {
  const channel = CHANNEL_PREFIX + taskId
  const subscriber = redis.duplicate()

  subscriber.on("message", (_ch, message) => {
    try {
      const event = JSON.parse(message) as TaskEvent
      onEvent(event)
    } catch { /* ignore malformed messages */ }
  })

  subscriber.subscribe(channel).catch((err) => {
    console.error(`[SSE] Subscribe failed for ${channel}:`, err.message)
  })

  return () => {
    subscriber.unsubscribe(channel).finally(() => subscriber.quit())
  }
}
