import { prisma } from "@/shared/database/prisma"

export class DialogueRepository {
  async findBySceneId(sceneId: string) {
    return prisma.dialogue.findMany({
      where: { sceneId },
      orderBy: { sequence: "asc" },
    })
  }

  async createMany(data: { sceneId: string; speaker: string; text: string; sequence: number }[]) {
    return prisma.dialogue.createMany({ data })
  }

  async deleteBySceneId(sceneId: string) {
    return prisma.dialogue.deleteMany({ where: { sceneId } })
  }
}
