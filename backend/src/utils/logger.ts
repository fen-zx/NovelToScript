// Pino 日志系统
import pino from "pino"
import { env } from "@/config/env"

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
})

// 便捷方法
export const log = {
  info: (msg: string, data?: object) => logger.info(data, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  error: (msg: string, err?: Error) => logger.error({ err: err?.message, stack: err?.stack }, msg),
  debug: (msg: string, data?: object) => logger.debug(data, msg),
}
