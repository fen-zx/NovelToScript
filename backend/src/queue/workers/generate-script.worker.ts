// Generate Script Worker — 7 Agent 流水线
import { Worker } from "bullmq"
import { redisConnection } from "@/shared/queue/queue-manager"
import { TaskRepository } from "@/modules/task/task.repository"
import { AgentResultRepository } from "@/modules/task/agent-result.repository"
import { NovelRepository } from "@/modules/novel/novel.repository"
import { ScriptRepository } from "@/modules/script/script.repository"
import { CharacterRepository } from "@/modules/script/character.repository"
import { SceneRepository } from "@/modules/script/scene.repository"
import { DialogueRepository } from "@/modules/script/dialogue.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { AIService } from "@/modules/ai/ai.service"
import { minioClient, storagePaths } from "@/shared/storage/minio"
import { logger } from "@/utils/logger"

const taskRepo = new TaskRepository()
const agentResultRepo = new AgentResultRepository()
const novelRepo = new NovelRepository()
const scriptRepo = new ScriptRepository()
const characterRepo = new CharacterRepository()
const sceneRepo = new SceneRepository()
const dialogueRepo = new DialogueRepository()
const versionRepo = new VersionRepository()
const aiService = new AIService()

export const generateScriptWorker = new Worker(
  "script-generation",
  async (job) => {
    const { taskId, userId, novelId } = job.data as { taskId: string; userId: string; novelId: string }

    // 更新状态 → PROCESSING
    await taskRepo.update(taskId, { status: "PROCESSING", startedAt: new Date() })

    try {
      // 1. 从 DB 获取小说元数据
      const novel = await novelRepo.findById(novelId)
      if (!novel) throw new Error(`Novel not found: ${novelId}`)

      // 2. 从 MinIO 读取小说原文
      const ext = novel.fileFormat.toLowerCase()
      const key = storagePaths.novel(userId, novelId, ext)
      logger.info(`[Worker] Reading novel from MinIO: ${key}`)

      const stream = await minioClient.getObject("novels", key)
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      const fullText = Buffer.concat(chunks).toString("utf-8")
      logger.info(`[Worker] Novel loaded: ${fullText.length} chars`)

      // 3. 启动 AI 流水线
      const pipeline = aiService.createPipeline(taskId, novelId)

      pipeline.on("agent-start", async (agent) => {
        logger.info(`[Worker] Agent start: ${agent}`)
        await taskRepo.update(taskId, { currentAgent: agent })
        await agentResultRepo.update(taskId, agent, { status: "RUNNING", startedAt: new Date() })
      })

      pipeline.on("agent-done", async (agent, output) => {
        logger.info(`[Worker] Agent done: ${agent}`)
        await agentResultRepo.update(taskId, agent, {
          status: "DONE", output: JSON.stringify(output), completedAt: new Date(),
        })
        await taskRepo.update(taskId, { progress: (pipeline.currentStep / 7) })
      })

      logger.info(`[Worker] Starting AI pipeline for task ${taskId}`)
      const result = await pipeline.run(fullText)
      logger.info(`[Worker] AI pipeline completed for task ${taskId}`)

      // 创建 Script + Version + Character + Scene + Dialogue
      const script = await scriptRepo.create({
        userId, novelId,
        title: result.title || "未命名剧本",
      })

      await versionRepo.create({
        scriptId: script.id, versionNumber: 1,
        content: result.yamlContent,
      })

      if (result.characters?.length) {
        await characterRepo.createMany(
          result.characters.map((c: any) => ({
            scriptId: script.id,
            name: c.name,
            role: c.role,
            description: c.description || null,
            traits: Array.isArray(c.traits) ? JSON.stringify(c.traits) : (c.traits || null),
          }))
        )
      }

      if (result.scenes?.length) {
        for (const scene of result.scenes) {
          // [TODO] scenes + dialogues saved to DB
        }
      }

      await taskRepo.update(taskId, {
        status: "COMPLETED", progress: 1, completedAt: new Date(),
      })

      return { scriptId: script.id }
    } catch (err: any) {
      logger.error(`[Worker] Task ${taskId} failed: ${err.message}`)
      await taskRepo.update(taskId, {
        status: "FAILED", errorMessage: err.message, completedAt: new Date(),
      })
      throw err
    }
  },
  { connection: redisConnection, concurrency: 1, lockDuration: 600_000 },
)
