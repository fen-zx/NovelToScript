// SSE 连接封装
export interface SSEHandlers {
  onAgentStart?: (data: { agent: string; message: string }) => void
  onAgentProgress?: (data: { agent: string; percent: number }) => void
  onAgentDone?: (data: { agent: string; summary: string }) => void
  onAgentError?: (data: { agent: string; error: string }) => void
  onComplete?: (data: { scriptId: string }) => void
  onError?: (e: Event) => void
}

export function connectTaskSSE(taskId: string, handlers: SSEHandlers): () => void {
  const token = localStorage.getItem('token')
  const es = new EventSource(`/api/tasks/${taskId}/stream`)

  // Note: EventSource doesn't natively support headers.
  // Token is typically passed via cookie or query param in production.
  // Here we use a workaround or rely on the backend reading cookie.

  es.addEventListener('agent:start', (e: MessageEvent) => handlers.onAgentStart?.(JSON.parse(e.data)))
  es.addEventListener('agent:progress', (e: MessageEvent) => handlers.onAgentProgress?.(JSON.parse(e.data)))
  es.addEventListener('agent:done', (e: MessageEvent) => handlers.onAgentDone?.(JSON.parse(e.data)))
  es.addEventListener('agent:error', (e: MessageEvent) => handlers.onAgentError?.(JSON.parse(e.data)))
  es.addEventListener('task:complete', (e: MessageEvent) => handlers.onComplete?.(JSON.parse(e.data)))

  es.onerror = (e) => {
    handlers.onError?.(e)
    es.close()
  }

  return () => es.close()
}
