import { prisma } from "@/shared/database/prisma"
import type { AgentStatus } from "@prisma/client"

export class AgentResultRepository {
  async findByTaskId(taskId: string) {
    return prisma.agentResult.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    })
  }

  async createMany(data: { taskId: string; agentName: string }[]) {
    return prisma.agentResult.createMany({ data })
  }

  async update(taskId: string, agentName: string, data: {
    status?: AgentStatus; output?: string; errorMessage?: string | null
    startedAt?: Date | null; completedAt?: Date | null
  }) {
    return prisma.agentResult.update({
      where: { taskId_agentName: { taskId, agentName } },
      data,
    })
  }

  async resetByTaskId(taskId: string) {
    return prisma.agentResult.updateMany({
      where: { taskId },
      data: { status: "PENDING", output: null, errorMessage: null, startedAt: null, completedAt: null },
    })
  }
}
