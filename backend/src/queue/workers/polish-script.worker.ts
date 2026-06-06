// Polish Script Worker — AI 润色任务
import { Worker } from "bullmq"
import { redisConnection } from "@/shared/queue/queue-manager"
import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { creativeModel } from "@/config/deepseek"
import { POLISH_PROMPT } from "@/modules/ai/prompts/polish.prompt"
import { logger } from "@/utils/logger"

const scriptRepo = new ScriptRepository()
const versionRepo = new VersionRepository()

export const polishScriptWorker = new Worker(
  "script-polish",
  async (job) => {
    const { scriptId, style, targetSection } = job.data as {
      scriptId: string; style: string; targetSection?: string
    }

    logger.info(`[PolishWorker] Starting polish: script=${scriptId} style=${style}`)

    const script = await scriptRepo.findById(scriptId)
    if (!script) throw new Error("Script not found")

    const currentVersion = await versionRepo.findLatestVersion(scriptId)
    if (!currentVersion) throw new Error("No version found")

    // AI 润色
    logger.info(`[PolishWorker] Calling DeepSeek API...`)
    const prompt = PromptTemplate.fromTemplate(POLISH_PROMPT)
    const chain = RunnableSequence.from([prompt, creativeModel, new StringOutputParser()])
    const polishedYaml = await chain.invoke({
      style,
      yaml: targetSection ?? currentVersion.content,
    })

    logger.info(`[PolishWorker] AI response: ${polishedYaml.length} chars`)

    // 写入新 Version
    const nextVersion = await versionRepo.getNextVersionNumber(scriptId)
    await versionRepo.create({
      scriptId,
      versionNumber: nextVersion,
      content: polishedYaml,
      note: `AI 润色 - ${style}`,
    })

    logger.info(`[PolishWorker] Version ${nextVersion} created`)
    await scriptRepo.update(scriptId, { currentVersion: nextVersion })

    return { versionNumber: nextVersion }
  },
  { connection: redisConnection, concurrency: 1, lockDuration: 120_000 },
)
