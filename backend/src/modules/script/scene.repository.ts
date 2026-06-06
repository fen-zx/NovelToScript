import { prisma } from "@/shared/database/prisma"

export class SceneRepository {
  async findByVersionId(versionId: string) {
    return prisma.scene.findMany({
      where: { versionId },
      orderBy: { sceneNumber: "asc" },
    })
  }

  async findByVersionIdWithDialogues(versionId: string) {
    return prisma.scene.findMany({
      where: { versionId },
      include: { dialogues: { orderBy: { sequence: "asc" } } },
      orderBy: { sceneNumber: "asc" },
    })
  }

  async createMany(data: { versionId: string; sceneNumber: number; location: string; time?: string; participants?: string }[]) {
    return prisma.scene.createMany({ data })
  }

  async deleteByVersionId(versionId: string) {
    return prisma.scene.deleteMany({ where: { versionId } })
  }
}
