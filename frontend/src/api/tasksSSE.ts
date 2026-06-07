// SSE 连接封装
export interface SSEHandlers {
  onAgentStart?: (data: { agent: string; message: string }) => void
  onAgentDone?: (data: { agent: string; summary: string; percent: number }) => void
  onAgentError?: (data: { agent: string; error: string }) => void
  onComplete?: (data: { scriptId: string }) => void
  onFailed?: (data: { error: string }) => void
  onError?: (e: Event) => void
}

export function connectTaskSSE(taskId: string, handlers: SSEHandlers): () => void {
  const token = localStorage.getItem('token')
  // EventSource 不支持自定义 Header，通过 query 参数传递 token
  const es = new EventSource(`/api/tasks/${taskId}/stream?token=${token}`)

  es.addEventListener('agent:start', (e: MessageEvent) => handlers.onAgentStart?.(JSON.parse(e.data)))
  es.addEventListener('agent:done', (e: MessageEvent) => handlers.onAgentDone?.(JSON.parse(e.data)))
  es.addEventListener('agent:error', (e: MessageEvent) => handlers.onAgentError?.(JSON.parse(e.data)))
  es.addEventListener('task:complete', (e: MessageEvent) => handlers.onComplete?.(JSON.parse(e.data)))
  es.addEventListener('task:failed', (e: MessageEvent) => handlers.onFailed?.(JSON.parse(e.data)))

  es.onerror = (e) => {
    handlers.onError?.(e)
    es.close()
  }

  return () => es.close()
}
