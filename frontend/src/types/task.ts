// Task 相关类型
import type { TaskStatus, AgentStatus } from './api'

export interface TaskSummary {
  id: string
  novelTitle: string
  status: TaskStatus
  progress: number
  currentAgent: string | null
  createdAt: string
}

export interface AgentResult {
  agentName: string
  status: AgentStatus
  output: Record<string, unknown> | null
  errorMessage?: string
  startedAt: string | null
  completedAt: string | null
}

export interface TaskDetail {
  id: string
  novelId: string
  novelTitle: string
  status: TaskStatus
  progress: number
  currentAgent: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  agentResults: AgentResult[]
  scriptId: string | null
  createdAt: string
}

export interface AgentState {
  name: string
  status: AgentStatus
  time: string | null
  progress: number
}
