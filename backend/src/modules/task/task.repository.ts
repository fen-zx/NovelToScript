import { prisma } from "@/shared/database/prisma"
import type { TaskStatus } from "@prisma/client"

export interface TaskQuery {
  userId: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "updatedAt" | "status"
  sortOrder?: "asc" | "desc"
}

export class TaskRepository {
  async findById(id: string) {
    return prisma.task.findUnique({ where: { id } })
  }

  async findByIdWithResults(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        agentResults: { orderBy: { createdAt: "asc" } },
        novel: { include: { scripts: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    })
  }

  async findByNovelId(novelId: string) {
    return prisma.task.findUnique({ where: { novelId } })
  }

  async findMany(query: TaskQuery) {
    const { userId, status, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" } = query
    const where: any = { userId }
    if (status) {
      where.status = { in: status.split(",") as TaskStatus[] }
    }

    const [list, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { novel: { select: { title: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.task.count({ where }),
    ])
    return { list, total }
  }

  async findPendingTasks() {
    return prisma.task.findMany({ where: { status: "QUEUED" }, orderBy: { createdAt: "asc" } })
  }

  async findFailedTasks() {
    return prisma.task.findMany({ where: { status: "FAILED" } })
  }

  async create(data: { novelId: string; userId: string }) {
    return prisma.task.create({
      data: {
        novelId: data.novelId,
        userId: data.userId,
        status: "QUEUED",
        progress: 0,
      },
    })
  }

  async update(id: string, data: {
    status?: TaskStatus; progress?: number; currentAgent?: string | null
    resumeFromAgent?: string | null; retryMode?: string | null
    errorMessage?: string | null; startedAt?: Date | null; completedAt?: Date | null
  }) {
    return prisma.task.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.task.delete({ where: { id } })
  }
}
