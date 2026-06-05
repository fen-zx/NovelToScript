// 全局类型定义 — API 响应 + 枚举

// === 响应壳 ===
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// === 枚举 ===
export type TaskStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type AgentStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
export type CharacterRole = 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING'
export type FileFormat = 'TXT' | 'DOCX' | 'MD'
export type PolishStyle = 'faithful' | 'tv_drama' | 'short_drama' | 'anime' | 'movie' | 'tv_series' | 'stage'
export type ExportFormat = 'yaml' | 'json' | 'md' | 'txt' | 'pdf'
export type RetryMode = 'resume' | 'restart'
