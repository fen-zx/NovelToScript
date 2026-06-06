// 环境变量加载 + 类型定义
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // MinIO
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "localhost",
  MINIO_PORT: parseInt(process.env.MINIO_PORT || "9000", 10),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minioadmin",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "minioadmin",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // DeepSeek
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",

  // Puppeteer
  PUPPETEER_EXECUTABLE: process.env.PUPPETEER_EXECUTABLE || undefined,
} as const
