import { Request, Response, NextFunction } from "express"
import { AppError } from "@/shared/errors/error-codes"
import { ZodError } from "zod"

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json(err.toResponse())
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 9002,
      message: "参数校验失败",
      data: err.errors,
    })
  }

  console.error("[Error]", err)
  return res.status(500).json({
    code: 9001,
    message: "服务器繁忙，请稍后重试",
    data: null,
  })
}
