import { prisma } from "@/shared/database/prisma"

export class VersionRepository {
  async findById(id: string) {
    return prisma.version.findUnique({ where: { id } })
  }

  async findByScriptId(scriptId: string) {
    return prisma.version.findMany({
      where: { scriptId },
      orderBy: { versionNumber: "desc" },
    })
  }

  async findLatestVersion(scriptId: string) {
    return prisma.version.findFirst({
      where: { scriptId },
      orderBy: { versionNumber: "desc" },
    })
  }

  async findByScriptIdAndNumber(scriptId: string, versionNumber: number) {
    return prisma.version.findUnique({
      where: { scriptId_versionNumber: { scriptId, versionNumber } },
    })
  }

  async findByScriptIdWithScenes(scriptId: string) {
    return prisma.version.findMany({
      where: { scriptId },
      include: {
        scenes: {
          orderBy: { sceneNumber: "asc" },
          include: { dialogues: { orderBy: { sequence: "asc" } } },
        },
      },
      orderBy: { versionNumber: "desc" },
    })
  }

  async create(data: { scriptId: string; versionNumber: number; content: string; note?: string }) {
    return prisma.version.create({ data })
  }

  async getNextVersionNumber(scriptId: string): Promise<number> {
    const latest = await prisma.version.findFirst({
      where: { scriptId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    })
    return (latest?.versionNumber ?? 0) + 1
  }
}
