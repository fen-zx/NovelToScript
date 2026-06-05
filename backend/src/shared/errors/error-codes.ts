// ============================================================
// Error Codes — 统一错误码定义 + 业务异常类
// ============================================================

// ═══════════════════════════════════════════════════════════════
// HTTP 状态码 → 前端处理策略
// ═══════════════════════════════════════════════════════════════

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const

// ═══════════════════════════════════════════════════════════════
// 业务错误码
// ═══════════════════════════════════════════════════════════════

/** 错误码枚举 — 前端根据 code 做差异化处理 */
export const ErrorCode = {
  // ── 成功 ──
  /** 操作成功 */
  SUCCESS: 0,

  // ── Auth (2001~2099) ──
  /** 账号已存在（注册时） */
  ACCOUNT_EXISTS: 2001,
  /** 用户名不存在（密码重置时） */
  USERNAME_NOT_FOUND: 2002,
  /** 账号或密码错误（登录时） */
  INVALID_CREDENTIALS: 2003,

  // ── Task (3001~3099) ──
  /** 排队已满（最多3个） */
  QUEUE_FULL: 3001,
  /** 任务不存在 */
  TASK_NOT_FOUND: 3002,
  /** 任务当前状态不允许此操作 */
  TASK_STATE_INVALID: 3003,

  // ── Script (4001~4099) ──
  /** 剧本不存在或已软删除 */
  SCRIPT_NOT_FOUND: 4001,
  /** 版本不存在 */
  VERSION_NOT_FOUND: 4002,
  /** 回滚目标版本号无效 */
  ROLLBACK_VERSION_INVALID: 4003,
  /** YAML 校验失败 */
  YAML_VALIDATION_FAILED: 4004,

  // ── Novel (5001~5099) ──
  /** 文件超过 20MB 限制 */
  FILE_TOO_LARGE: 5001,
  /** 不支持的文件格式 */
  FILE_FORMAT_UNSUPPORTED: 5002,
  /** 小说不存在 */
  NOVEL_NOT_FOUND: 5003,

  // ── 通用 (9001~9999) ──
  /** 服务器内部错误 */
  INTERNAL_ERROR: 9001,
  /** 参数校验失败 */
  VALIDATION_ERROR: 9002,
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

// ═══════════════════════════════════════════════════════════════
// 错误码 → 消息映射
// ═══════════════════════════════════════════════════════════════

const ERROR_MESSAGES: Record<ErrorCodeValue, string> = {
  [ErrorCode.SUCCESS]: "操作成功",

  [ErrorCode.ACCOUNT_EXISTS]: "账号已存在",
  [ErrorCode.USERNAME_NOT_FOUND]: "用户名不存在",
  [ErrorCode.INVALID_CREDENTIALS]: "账号或密码错误",

  [ErrorCode.QUEUE_FULL]: "排队已满（最多 3 个），请稍后再试",
  [ErrorCode.TASK_NOT_FOUND]: "任务不存在",
  [ErrorCode.TASK_STATE_INVALID]: "任务当前状态不允许此操作",

  [ErrorCode.SCRIPT_NOT_FOUND]: "剧本不存在或已删除",
  [ErrorCode.VERSION_NOT_FOUND]: "版本不存在",
  [ErrorCode.ROLLBACK_VERSION_INVALID]: "回滚目标版本号无效",
  [ErrorCode.YAML_VALIDATION_FAILED]: "YAML 格式校验失败",

  [ErrorCode.FILE_TOO_LARGE]: "文件超过 20MB 限制",
  [ErrorCode.FILE_FORMAT_UNSUPPORTED]: "不支持的文件格式，仅支持 txt/docx/md",
  [ErrorCode.NOVEL_NOT_FOUND]: "小说不存在",

  [ErrorCode.INTERNAL_ERROR]: "服务器繁忙，请稍后重试",
  [ErrorCode.VALIDATION_ERROR]: "参数校验失败",
}

// ═══════════════════════════════════════════════════════════════
// 业务异常类
// ═══════════════════════════════════════════════════════════════

/** 标准业务异常 */
export class AppError extends Error {
  public readonly code: ErrorCodeValue
  public readonly httpStatus: number
  public readonly details?: unknown

  constructor(
    code: ErrorCodeValue,
    httpStatus?: number,
    details?: unknown,
  ) {
    super(ERROR_MESSAGES[code] || "未知错误")
    this.name = "AppError"
    this.code = code
    this.httpStatus = httpStatus ?? this.inferHttpStatus(code)
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /** 根据错误码推断合理的 HTTP 状态码 */
  private inferHttpStatus(code: ErrorCodeValue): number {
    switch (code) {
      case ErrorCode.ACCOUNT_EXISTS:
        return HTTP_STATUS.CONFLICT
      case ErrorCode.USERNAME_NOT_FOUND:
      case ErrorCode.TASK_NOT_FOUND:
      case ErrorCode.SCRIPT_NOT_FOUND:
      case ErrorCode.VERSION_NOT_FOUND:
      case ErrorCode.NOVEL_NOT_FOUND:
        return HTTP_STATUS.NOT_FOUND
      case ErrorCode.INVALID_CREDENTIALS:
        return HTTP_STATUS.UNAUTHORIZED
      case ErrorCode.QUEUE_FULL:
        return HTTP_STATUS.TOO_MANY_REQUESTS
      case ErrorCode.FILE_TOO_LARGE:
        return HTTP_STATUS.PAYLOAD_TOO_LARGE
      case ErrorCode.FILE_FORMAT_UNSUPPORTED:
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.YAML_VALIDATION_FAILED:
        return HTTP_STATUS.BAD_REQUEST
      case ErrorCode.TASK_STATE_INVALID:
      case ErrorCode.ROLLBACK_VERSION_INVALID:
        return HTTP_STATUS.BAD_REQUEST
      default:
        return HTTP_STATUS.INTERNAL_ERROR
    }
  }

  /** 转为标准响应壳 */
  toResponse(): { code: number; message: string; data: null } {
    return {
      code: this.code,
      message: this.message,
      data: null,
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 便捷工厂函数
// ═══════════════════════════════════════════════════════════════

export const Errors = {
  accountExists: () => new AppError(ErrorCode.ACCOUNT_EXISTS),
  usernameNotFound: () => new AppError(ErrorCode.USERNAME_NOT_FOUND),
  invalidCredentials: () => new AppError(ErrorCode.INVALID_CREDENTIALS),

  queueFull: () => new AppError(ErrorCode.QUEUE_FULL),
  taskNotFound: () => new AppError(ErrorCode.TASK_NOT_FOUND),
  taskStateInvalid: () => new AppError(ErrorCode.TASK_STATE_INVALID),

  scriptNotFound: () => new AppError(ErrorCode.SCRIPT_NOT_FOUND),
  versionNotFound: () => new AppError(ErrorCode.VERSION_NOT_FOUND),
  rollbackVersionInvalid: () => new AppError(ErrorCode.ROLLBACK_VERSION_INVALID),
  yamlValidationFailed: (details?: unknown) =>
    new AppError(ErrorCode.YAML_VALIDATION_FAILED, undefined, details),

  fileTooLarge: () => new AppError(ErrorCode.FILE_TOO_LARGE),
  fileFormatUnsupported: () => new AppError(ErrorCode.FILE_FORMAT_UNSUPPORTED),
  novelNotFound: () => new AppError(ErrorCode.NOVEL_NOT_FOUND),

  internal: (details?: unknown) =>
    new AppError(ErrorCode.INTERNAL_ERROR, undefined, details),
  validation: (details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_ERROR, undefined, details),
}

// ═══════════════════════════════════════════════════════════════
// 成功响应辅助
// ═══════════════════════════════════════════════════════════════

export function success<T>(data: T, message = "success") {
  return {
    code: ErrorCode.SUCCESS,
    message,
    data,
  }
}

export function paginated<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    code: ErrorCode.SUCCESS,
    message: "success",
    data: { list, total, page, pageSize },
  }
}
