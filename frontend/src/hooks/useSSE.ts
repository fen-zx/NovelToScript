// SSE 通用 Hook — 自动重连 + 心跳
import { onUnmounted } from 'vue'

export interface SSEOptions {
  retryTimes?: number
  retryDelay?: number
  heartbeatTimeout?: number
}

export function useSSE(
  url: string,
  handlers: Record<string, (data: Record<string, unknown>) => void>,
  options: SSEOptions = {}
) {
  const { retryTimes = 3, retryDelay = 2000, heartbeatTimeout = 30000 } = options

  let es: EventSource | null = null
  let retryCount = 0
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let lastEventTime = Date.now()

  function connect() {
    es = new EventSource(url)

    // 注册事件
    Object.entries(handlers).forEach(([event, handler]) => {
      es!.addEventListener(event, (e: MessageEvent) => {
        lastEventTime = Date.now()
        try {
          handler(JSON.parse(e.data))
        } catch {
          handler({ raw: e.data } as unknown as Record<string, unknown>)
        }
      })
    })

    // 心跳检测
    heartbeatTimer = setInterval(() => {
      if (Date.now() - lastEventTime > heartbeatTimeout) {
        close()
        reconnect()
      }
    }, heartbeatTimeout)

    es.onerror = () => {
      close()
      reconnect()
    }
  }

  function reconnect() {
    if (retryCount >= retryTimes) return
    retryCount++
    setTimeout(connect, retryDelay * Math.pow(2, retryCount - 1))
  }

  function close() {
    es?.close()
    es = null
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  connect()

  onUnmounted(() => close())

  return { close, reconnect }
}
