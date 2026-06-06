import { TaskRepository } from "./task.repository"
import { AgentResultRepository } from "./agent-result.repository"
import { ScriptRepository } from "@/modules/script/script.repository"
import { Errors } from "@/shared/errors/error-codes"
import { prisma } from "@/shared/database/prisma"
import { scriptGenerationQueue, isScriptGenQueueFull } from "@/shared/queue/queue-manager"

const AGENT_NAMES = [
  "NovelAnalysis", "CharacterExtraction", "PlotAnalysis",
  "ScenePlanning", "ScriptGeneration", "YamlValidation", "ScriptPolish",
]

export class TaskService {
  constructor(
    private taskRepo = new TaskRepository(),
    private agentResultRepo = new AgentResultRepository(),
    private scriptRepo = new ScriptRepository(),
  ) {}

  async createTask(userId: string, novelId: string) {
    // 检查是否已有任务 (1:1)
    const existing = await this.taskRepo.findByNovelId(novelId)
    if (existing) throw Errors.validation("该小说已有分析任务")

    // 检查队列上限
    const full = await isScriptGenQueueFull()
    if (full) throw Errors.queueFull()

    // 事务: Task + 7 AgentResult
    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: { novelId, userId, status: "QUEUED", progress: 0 },
      })
      await tx.agentResult.createMany({
        data: AGENT_NAMES.map((agentName) => ({
          taskId: t.id, agentName, status: "PENDING",
        })),
      })
      return t
    })

    // 入队
    await scriptGenerationQueue.add("generate", { taskId: task.id, userId, novelId })

    return { id: task.id, status: task.status, progress: task.progress }
  }

  async getTaskList(query: { userId: string; status?: string; page?: number; pageSize?: number; sortBy?: any; sortOrder?: any }) {
    return this.taskRepo.findMany(query)
  }

  async getTaskById(taskId: string) {
    const task = await this.taskRepo.findByIdWithResults(taskId)
    if (!task) throw Errors.taskNotFound()
    return task
  }

  async retryTask(taskId: string, mode: "resume" | "restart") {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw Errors.taskNotFound()
    if (task.status !== "FAILED") throw Errors.taskStateInvalid()

    if (mode === "restart") {
      await this.agentResultRepo.resetByTaskId(taskId)
    }

    await this.taskRepo.update(taskId, {
      status: "QUEUED",
      progress: 0,
      retryMode: mode,
      resumeFromAgent: mode === "resume" ? task.currentAgent : null,
      errorMessage: null,
      completedAt: null,
    })

    await scriptGenerationQueue.add("generate", { taskId, userId: task.userId, novelId: task.novelId })

    return { id: taskId, status: "QUEUED" }
  }

  async deleteTask(taskId: string) {
    const task = await this.taskRepo.findById(taskId)
    if (!task) throw Errors.taskNotFound()
    await this.taskRepo.delete(taskId)
  }
}
