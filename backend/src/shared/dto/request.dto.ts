// ============================================================
// Request DTO — 全部接口的请求参数定义 + Zod 校验
// ============================================================

import { z } from "zod"

// ═══════════════════════════════════════════════════════════════
// Auth模块
// ═══════════════════════════════════════════════════════════════

/** A0a 用户注册 */
export const RegisterDto = z.object({
  username: z.string().min(2).max(20),
  account: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
})
export type RegisterDto = z.infer<typeof RegisterDto>

/** A0b 用户登录 */
export const LoginDto = z.object({
  account: z.string(),
  password: z.string(),
})
export type LoginDto = z.infer<typeof LoginDto>

/** A0c 密码重置 */
export const ResetPasswordDto = z.object({
  username: z.string(),
  newPassword: z.string().min(6).max(100),
})
export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>

/** A0d 账号可用性检查 */
export const CheckAccountQuery = z.object({
  check: z.literal("account"),
  value: z.string().min(3).max(30),
})
export type CheckAccountQuery = z.infer<typeof CheckAccountQuery>

// ═══════════════════════════════════════════════════════════════
// Novel模块
// ═══════════════════════════════════════════════════════════════

/** A1 导入小说 — 文件由 multer 处理，此处仅定义文本字段 */
export const ImportNovelBody = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(100).optional(),
})
export type ImportNovelBody = z.infer<typeof ImportNovelBody>

/** 文件上传约束 */
export const FILE_LIMITS = {
  maxSize: 20 * 1024 * 1024, // 20MB
  allowedMimes: [
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
    "text/x-markdown",
  ],
  allowedExtensions: [".txt", ".docx", ".md"],
} as const

// ═══════════════════════════════════════════════════════════════
// Task模块
// ═══════════════════════════════════════════════════════════════

/** A2 创建分析任务 */
export const CreateTaskDto = z.object({
  novelId: z.string(),
})
export type CreateTaskDto = z.infer<typeof CreateTaskDto>

/** A3 任务列表查询 */
export const TaskListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})
export type TaskListQuery = z.infer<typeof TaskListQuery>

/** A10 重试任务 */
export const RetryTaskDto = z.object({
  mode: z.enum(["resume", "restart"]),
})
export type RetryTaskDto = z.infer<typeof RetryTaskDto>

// ═══════════════════════════════════════════════════════════════
// Script模块
// ═══════════════════════════════════════════════════════════════

/** A7 更新剧本 */
export const UpdateScriptDto = z.object({
  content: z.string(),
  note: z.string().max(500).optional(),
})
export type UpdateScriptDto = z.infer<typeof UpdateScriptDto>

/** A8 AI润色 */
export const PolishStyle = z.enum([
  "faithful",    // 原著还原
  "tv_drama",    // 影视剧风格
  "short_drama", // 短剧风格
  "anime",       // 动漫风格
  "movie",       // 电影风格
  "tv_series",   // 电视剧风格
  "stage",       // 舞台剧风格
])
export type PolishStyle = z.infer<typeof PolishStyle>

export const PolishScriptDto = z.object({
  style: PolishStyle,
  targetSection: z.string().optional(),
})
export type PolishScriptDto = z.infer<typeof PolishScriptDto>

/** A13 版本回滚 */
export const RollbackDto = z.object({
  version: z.number().int().min(1),
})
export type RollbackDto = z.infer<typeof RollbackDto>

/** A14 导出剧本 */
export const ExportFormat = z.enum(["yaml", "json", "md", "txt", "pdf"])
export type ExportFormat = z.infer<typeof ExportFormat>

export const ExportQuery = z.object({
  format: ExportFormat,
})
export type ExportQuery = z.infer<typeof ExportQuery>

// ═══════════════════════════════════════════════════════════════
// 路径参数 (用于 controller 层验证)
// ═══════════════════════════════════════════════════════════════

/** 通用 ID 参数 */
export const IdParam = z.object({
  id: z.string(),
})
export type IdParam = z.infer<typeof IdParam>

/** 版本号参数 */
export const VersionParam = z.object({
  id: z.string(),
  version: z.coerce.number().int().min(1),
})
export type VersionParam = z.infer<typeof VersionParam>
