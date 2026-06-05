import { prisma } from "@/shared/database/prisma"

export class ScriptRepository {
  async findById(id: string) {
    return prisma.script.findFirst({ where: { id, deletedAt: null } })
  }

  async findByNovelId(novelId: string) {
    return prisma.script.findFirst({ where: { novelId, deletedAt: null } })
  }

  async findByIdWithDetail(id: string) {
    return prisma.script.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        characters: true,
      },
    })
  }

  async findByUserId(userId: string, page = 1, pageSize = 20) {
    const where = { userId, deletedAt: null }
    const [list, total] = await Promise.all([
      prisma.script.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.script.count({ where }),
    ])
    return { list, total }
  }

  async create(data: { userId: string; novelId: string; title: string }) {
    return prisma.script.create({ data })
  }

  async update(id: string, data: { title?: string; currentVersion?: number }) {
    return prisma.script.update({ where: { id }, data })
  }

  async incrementVersion(id: string) {
    return prisma.script.update({
      where: { id },
      data: { currentVersion: { increment: 1 } },
    })
  }

  async softDelete(id: string) {
    return prisma.script.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
