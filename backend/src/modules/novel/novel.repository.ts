import { prisma } from "@/shared/database/prisma"
import type { FileFormat } from "@prisma/client"

export interface NovelQuery {
  userId: string
  keyword?: string
  fileFormat?: FileFormat
  page?: number
  pageSize?: number
  sortBy?: "createdAt"
  sortOrder?: "asc" | "desc"
}

export class NovelRepository {
  async findById(id: string) {
    return prisma.novel.findUnique({ where: { id } })
  }

  async findMany(query: NovelQuery) {
    const { userId, keyword, fileFormat, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" } = query
    const where: any = { userId }
    if (fileFormat) where.fileFormat = fileFormat
    if (keyword) where.title = { contains: keyword }

    const [list, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.novel.count({ where }),
    ])
    return { list, total }
  }

  async create(data: {
    userId: string; title: string; author?: string; chapterCount: number
    wordCount: number; fileFormat: FileFormat; filePath?: string
  }) {
    return prisma.novel.create({ data })
  }

  async delete(id: string) {
    return prisma.novel.delete({ where: { id } })
  }
}
