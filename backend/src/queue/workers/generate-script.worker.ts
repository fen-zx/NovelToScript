// Generate Script Worker — 7 Agent 流水线
import { Worker } from "bullmq"
import { redis } from "@/shared/cache/redis"
import { TaskRepository } from "@/modules/task/task.repository"
import { AgentResultRepository } from "@/modules/task/agent-result.repository"
import { ScriptRepository } from "@/modules/script/script.repository"
import { CharacterRepository } from "@/modules/script/character.repository"
import { SceneRepository } from "@/modules/script/scene.repository"
import { DialogueRepository } from "@/modules/script/dialogue.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { AIService } from "@/modules/ai/ai.service"

const taskRepo = new TaskRepository()
const agentResultRepo = new AgentResultRepository()
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
      const pipeline = aiService.createPipeline(taskId, novelId)

      pipeline.on("agent-start", async (agent) => {
        await taskRepo.update(taskId, { currentAgent: agent })
        await agentResultRepo.update(taskId, agent, { status: "RUNNING", startedAt: new Date() })
      })

      pipeline.on("agent-done", async (agent, output) => {
        await agentResultRepo.update(taskId, agent, {
          status: "DONE", output: JSON.stringify(output), completedAt: new Date(),
        })
        await taskRepo.update(taskId, { progress: (pipeline.currentStep / 7) })
      })

      const result = await pipeline.run()

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
          result.characters.map((c: any) => ({ scriptId: script.id, ...c }))
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
      await taskRepo.update(taskId, {
        status: "FAILED", errorMessage: err.message, completedAt: new Date(),
      })
      throw err
    }
  },
  { connection: redis, concurrency: 1, lockDuration: 600_000 },
)
