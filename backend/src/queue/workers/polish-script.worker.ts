// Polish Script Worker — AI 润色任务（支持大文件场景级分片）
import { Worker } from "bullmq"
import { redisConnection } from "@/shared/queue/queue-manager"
import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { polishModel } from "@/config/deepseek"
import { POLISH_PROMPT } from "@/modules/ai/prompts/polish.prompt"
import { OutputParser } from "@/modules/ai/output-parser"
import { logger } from "@/utils/logger"

const scriptRepo = new ScriptRepository()
const versionRepo = new VersionRepository()

/** 归一化场景 YAML 的缩进，确保所有场景字段使用一致的 2-space 缩进 */
function normalizeSceneIndent(sceneYaml: string): string {
  const lines = sceneYaml.split("\n")
  if (lines.length < 2) return sceneYaml

  // 找到第一个缩进行（sceneNumber 之后的第一个子字段）的实际缩进量
  let actualBaseIndent = 0
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/^(\s+)\S/)
    if (m) {
      actualBaseIndent = m[1].length
      break
    }
  }

  const expectedBaseIndent = 2
  if (actualBaseIndent === 0 || actualBaseIndent === expectedBaseIndent) return sceneYaml

  const diff = actualBaseIndent - expectedBaseIndent

  return lines
    .map((line) => {
      if (diff > 0) {
        // AI 多加了缩进 → 减少 diff 个空格
        const leading = line.match(/^(\s*)/)![0]
        if (leading.length >= diff) return line.slice(diff)
      } else {
        // AI 少了缩进 → 补充 |diff| 个空格（非 sceneNumber 行）
        if (/^-\s+sceneNumber:/.test(line)) return line
        if (line.trim() === "") return line
        const addSpaces = " ".repeat(-diff)
        return addSpaces + line
      }
      return line
    })
    .join("\n")
}

/** 归一化完整 YAML 中所有场景的缩进 */
function normalizeYamlIndent(yaml: string): string {
  const sceneChunks = splitYamlByScenes(yaml)
  if (sceneChunks.length === 0) return yaml
  const header = extractYamlHeader(yaml)
  const normalizedScenes = sceneChunks.map(normalizeSceneIndent)
  return `${header}\n${normalizedScenes.join("\n")}`
}

/** 按 scene 拆分 YAML 文本，返回每个 scene 的原始文本块 */
function splitYamlByScenes(yaml: string): string[] {
  const scenes: string[] = []
  const lines = yaml.split("\n")
  let currentScene = ""
  let inScene = false

  for (const line of lines) {
    // 检测 scene 开始（顶级 scenes 列表项，以 "- sceneNumber:" 或 "  - sceneNumber:" 开头）
    if (/^\s{0,2}-\s+sceneNumber:/.test(line)) {
      if (currentScene.trim()) {
        scenes.push(currentScene)
      }
      currentScene = line + "\n"
      inScene = true
    } else if (inScene) {
      currentScene += line + "\n"
    }
  }
  if (currentScene.trim()) {
    scenes.push(currentScene)
  }

  return scenes
}

/** 提取 YAML 头部（title, metadata, characters） */
function extractYamlHeader(yaml: string): string {
  const lines = yaml.split("\n")
  const headerLines: string[] = []
  for (const line of lines) {
    if (/^\s{0,2}-\s+sceneNumber:/.test(line)) break
    headerLines.push(line)
  }
  return headerLines.join("\n")
}

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

    const yamlContent = targetSection ?? currentVersion.content

    // 场景分片：YAML > 12000 字符时分场景润色，避免输出截断
    const sceneChunks = splitYamlByScenes(yamlContent)
    const yamlHeader = extractYamlHeader(yamlContent)
    const useChunked = yamlContent.length > 12000 && sceneChunks.length > 1

    let polishedYaml: string

    if (useChunked) {
      logger.info(`[PolishWorker] Large YAML (${yamlContent.length} chars), chunking into ${sceneChunks.length} scenes`)

      const polishedScenes: string[] = []
      const prompt = PromptTemplate.fromTemplate(POLISH_PROMPT)
      const chain = RunnableSequence.from([prompt, polishModel, new StringOutputParser()])

      for (let i = 0; i < sceneChunks.length; i++) {
        // 构建分片上下文：头部 + 当前场景
        const chunkInput = `${yamlHeader}\n\n# === 以下仅需润色第 ${i + 1}/${sceneChunks.length} 个场景 ===\n${sceneChunks[i]}`
        logger.info(`[PolishWorker] Polishing scene ${i + 1}/${sceneChunks.length} (${sceneChunks[i].length} chars)`)

        const raw = await chain.invoke({ style, yaml: chunkInput })
        const cleaned = OutputParser.extractYaml(raw)

        // 从润色结果中提取场景内容（去掉可能重复的头部）
        const sceneOnly = cleaned
          .replace(/^[\s\S]*?(?=^\s{0,2}-\s+sceneNumber:)/m, "") // 去掉头部
          .trim()
        polishedScenes.push(normalizeSceneIndent(sceneOnly))

        logger.info(`[PolishWorker] Scene ${i + 1} done: ${raw.length} → ${cleaned.length} chars`)
      }

      polishedYaml = `${yamlHeader}\n${polishedScenes.join("\n")}`
    } else {
      // 小文件直接润色
      logger.info(`[PolishWorker] Small YAML (${yamlContent.length} chars), direct polish`)
      const prompt = PromptTemplate.fromTemplate(POLISH_PROMPT)
      const chain = RunnableSequence.from([prompt, polishModel, new StringOutputParser()])
      const raw = await chain.invoke({ style, yaml: yamlContent })
      polishedYaml = normalizeYamlIndent(OutputParser.extractYaml(raw))
      logger.info(`[PolishWorker] Direct polish: ${raw.length} → ${polishedYaml.length} chars`)
    }

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
  { connection: redisConnection, concurrency: 1, lockDuration: 300_000 },
)
