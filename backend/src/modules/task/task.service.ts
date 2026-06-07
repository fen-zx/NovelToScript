import { TaskRepository } from "./task.repository"
import { AgentResultRepository } from "./agent-result.repository"
import { ScriptRepository } from "@/modules/script/script.repository"
import { Errors } from "@/shared/errors/error-codes"
import { prisma } from "@/shared/database/prisma"
import { redis } from "@/shared/cache/redis"
import { scriptGenerationQueue, isScriptGenQueueFull } from "@/shared/queue/queue-manager"

const AGENT_NAMES = [
  "NovelAnalysis", "CharacterExtraction", "PlotAnalysis",
  "ScenePlanning", "ScriptGeneration", "YamlValidation", "FaithfulnessCheck", "ScriptPolish",
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
    const cacheKey = `task:list:${query.userId}:${query.page || 1}:${query.status || "all"}:${query.sortBy || "createdAt"}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const result = await this.taskRepo.findMany(query)
    const data = {
      ...result,
      list: result.list.map((t: any) => ({
        ...t,
        novelTitle: t.novel?.title ?? "未知",
      })),
    }
    await redis.setex(cacheKey, 10, JSON.stringify(data)) // 10s TTL
    return data
  }

  async getTaskById(taskId: string) {
    const task = await this.taskRepo.findByIdWithResults(taskId)
    if (!task) throw Errors.taskNotFound()
    // Prisma include 返回的 relation 字段在严格类型推断下不可见，需要 any 断言
    const t = task as any
    return {
      ...task,
      scriptId: t.novel?.script?.[0]?.id ?? null,
      novelTitle: t.novel?.title ?? "未知",
    }
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
