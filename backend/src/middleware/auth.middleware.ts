import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "@/config/env"

export interface AuthRequest extends Request {
  userId?: string
  role?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // 优先从 Header 取，其次从 query 参数取（兼容 EventSource SSE）
  let token: string | undefined
  const header = req.headers.authorization
  if (header?.startsWith("Bearer ")) {
    token = header.slice(7)
  } else if (typeof req.query.token === "string") {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ code: 2003, message: "未登录", data: null })
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string }
    req.userId = payload.userId
    req.role = payload.role
    next()
  } catch {
    return res.status(401).json({ code: 2003, message: "Token 已过期", data: null })
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { userId: string; role: string }
      req.userId = payload.userId
      req.role = payload.role
    } catch { /* ignore */ }
  }
  next()
}
