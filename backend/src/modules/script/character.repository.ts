import { prisma } from "@/shared/database/prisma"
import type { CharacterRole } from "@prisma/client"

export class CharacterRepository {
  async findByScriptId(scriptId: string) {
    return prisma.character.findMany({
      where: { scriptId },
      orderBy: { createdAt: "asc" },
    })
  }

  async createMany(data: { scriptId: string; name: string; role: CharacterRole; description?: string; traits?: string }[]) {
    return prisma.character.createMany({ data })
  }

  async deleteByScriptId(scriptId: string) {
    return prisma.character.deleteMany({ where: { scriptId } })
  }
}
