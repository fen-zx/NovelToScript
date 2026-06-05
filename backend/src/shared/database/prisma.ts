// Prisma Client 单例 (Prisma 7 + SQLite adapter)
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
})

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development"
    ? ["warn", "error"]
    : ["error"],
})

export async function connectDB(): Promise<void> {
  await prisma.$connect()
  console.log("[DB] Prisma connected")
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect()
  console.log("[DB] Prisma disconnected")
}
