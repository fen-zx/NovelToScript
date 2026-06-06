import { Request, Response, NextFunction } from "express"
import type { ZodTypeAny } from "zod"

/**
 * Zod 校验中间件
 *
 * Express 5 中 req.query 是原型链上的 getter-only 属性，
 * 直接赋值 (req.query = data) 在严格模式下抛 TypeError，
 * 在非严格模式下静默失败。因此必须用 Object.defineProperty
 * 来覆盖它，确保校验后的数据能正确传递给后续处理器。
 */
export function validate(schema: ZodTypeAny, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = schema.parse(req[source])

    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: data,
        enumerable: true,
        configurable: true,
      })
    } else {
      req[source] = data
    }

    next()
  }
}
