// ============================================================
// Response DTO — 全部接口的响应结构定义
// ============================================================

// ═══════════════════════════════════════════════════════════════
// 通用响应壳
// ═══════════════════════════════════════════════════════════════

/** 标准 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ═══════════════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════════════

/** A0a 注册响应 */
export interface RegisterResponse {
  id: string
  username: string
  account: string
  createdAt: string
}

/** A0b 登录响应 */
export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    account: string
  }
}

/** A0d 账号检查响应 */
export interface AccountCheckResponse {
  available: boolean
}

// ═══════════════════════════════════════════════════════════════
// Novel
// ═══════════════════════════════════════════════════════════════

/** A1 导入小说响应 */
export interface NovelResponse {
  id: string
  title: string
  author: string | null
  chapterCount: number
  wordCount: number
  fileFormat: "TXT" | "DOCX" | "MD"
  createdAt: string
}

// ═══════════════════════════════════════════════════════════════
// Task
// ═══════════════════════════════════════════════════════════════

/** A2 / A10 创建/重试任务响应 */
export interface TaskCreatedResponse {
  id: string
  status: string
  progress: number
}

/** A3 任务列表项 */
export interface TaskSummaryResponse {
  id: string
  novelTitle: string
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
  progress: number
  currentAgent: string | null
  createdAt: string
}

/** Agent 结果 */
export interface AgentResultResponse {
  agentName: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED"
  output: unknown | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
}

/** A4 任务详情响应 */
export interface TaskDetailResponse {
  id: string
  novelId: string
  novelTitle: string
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
  progress: number
  currentAgent: string | null
  resumeFromAgent: string | null
  retryMode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  agentResults: AgentResultResponse[]
}

// ═══════════════════════════════════════════════════════════════
// Script
// ═══════════════════════════════════════════════════════════════

/** 剧本人物 */
export interface CharacterResponse {
  id: string
  name: string
  role: "PROTAGONIST" | "ANTAGONIST" | "SUPPORTING"
  description: string | null
  traits: string[] | null
}

/** A6 获取剧本响应 */
export interface ScriptDetailResponse {
  id: string
  userId: string
  novelId: string
  title: string
  currentVersion: number
  content: string // YAML 文本
  characters: CharacterResponse[]
  createdAt: string
  updatedAt: string
}

/** A7 更新剧本响应 */
export interface ScriptUpdatedResponse {
  id: string
  currentVersion: number
  updatedAt: string
}

/** A8 润色响应（异步） */
export interface PolishResponse {
  taskId: string
  status: string
}

/** A11 版本摘要 */
export interface VersionSummaryResponse {
  versionNumber: number
  note: string | null
  createdAt: string
}

/** A12 版本详情 */
export interface VersionDetailResponse {
  id: string
  versionNumber: number
  content: string
  note: string | null
  createdAt: string
}

/** A13 回滚响应 */
export interface RollbackResponse {
  id: string
  currentVersion: number
}

// ═══════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════

/** Schema 节点 */
export interface SchemaField {
  key: string
  type: string
  required: boolean
  description: string
  children?: SchemaField[]
}

/** A9 Schema 文档响应 */
export interface SchemaResponse {
  version: string
  fields: SchemaField[]
  example: string // YAML 示例文本
  rationale: string
}
