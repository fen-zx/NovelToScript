// AI Service — 7 Agent 流水线编排 (含忠实度校验)
import { EventEmitter } from "events"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel, creativeModel, generationModel } from "@/config/deepseek"
import { chunkNovel, buildSmartSummary, type TextChunk } from "./text-chunker"
import { NOVEL_ANALYSIS_PROMPT } from "./prompts/novel-analysis.prompt"
import { CHARACTER_EXTRACTION_PROMPT } from "./prompts/character-extraction.prompt"
import { PLOT_ANALYSIS_PROMPT } from "./prompts/plot-analysis.prompt"
import { SCENE_PLANNING_PROMPT } from "./prompts/scene-planning.prompt"
import { SCRIPT_GENERATION_PROMPT } from "./prompts/script-generation.prompt"
import { YAML_VALIDATION_PROMPT } from "./prompts/yaml-validation.prompt"
import { FAITHFULNESS_CHECK_PROMPT } from "./prompts/faithfulness-check.prompt"
import { OutputParser } from "./output-parser"

const TOTAL_STEPS = 7 // 7 main steps (FaithfulnessCheck = step 6.5, not counted)
const JSON_RETRY_MAX = 2

export class AgentPipeline extends EventEmitter {
  public currentStep = 0
  private results: Record<string, any> = {}

  constructor(
    private taskId: string,
    private novelId: string,
  ) {
    super()
  }

  async run(fullText: string) {
    const chunks = chunkNovel(fullText)
    const summary = buildSmartSummary(fullText, 20000)

    // ═══ Step 1: Novel Analysis — 分片并行分析，合并结果 ═══
    this.currentStep = 1
    this.emit("agent-start", "NovelAnalysis")
    const analysisResults = await Promise.all(
      chunks.map((chunk, i) =>
        this.invokeWithRetry(NOVEL_ANALYSIS_PROMPT, {
          text: chunk.text,
          part: `第${i + 1}/${chunks.length}部分`,
          chapterRef: chunk.chapterRef || "正文",
        }, analysisModel)
      )
    )
    this.results.analysis = this.mergeAnalysis(analysisResults, chunks)
    this.emit("agent-done", "NovelAnalysis", this.results.analysis)

    // ═══ Step 2: Character Extraction ═══
    this.currentStep = 2
    this.emit("agent-start", "CharacterExtraction")
    const charResult = await this.invokeWithRetry(CHARACTER_EXTRACTION_PROMPT, {
      summary: JSON.stringify(this.results.analysis).slice(0, 4000),
      text: summary,
    }, analysisModel)
    this.results.characters = charResult
    this.emit("agent-done", "CharacterExtraction", this.results.characters)

    // ═══ Step 3: Plot Analysis ═══
    this.currentStep = 3
    this.emit("agent-start", "PlotAnalysis")
    const plotResult = await this.invokeWithRetry(PLOT_ANALYSIS_PROMPT, {
      characters: JSON.stringify(this.results.characters).slice(0, 3000),
      summary,
    }, analysisModel)
    this.results.plot = plotResult
    this.emit("agent-done", "PlotAnalysis", this.results.plot)

    // ═══ Step 4: Scene Planning ═══
    this.currentStep = 4
    this.emit("agent-start", "ScenePlanning")
    const sceneResult = await this.invokeWithRetry(SCENE_PLANNING_PROMPT, {
      plotAnalysis: JSON.stringify(this.results.plot).slice(0, 4000),
      characters: JSON.stringify(this.results.characters).slice(0, 3000),
      sourceText: summary,
    }, creativeModel)
    this.results.scenes = sceneResult
    this.emit("agent-done", "ScenePlanning", this.results.scenes)

    // ═══ Step 5: Script Generation ═══
    this.currentStep = 5
    this.emit("agent-start", "ScriptGeneration")
    const yamlRaw = await this.invokeWithRetry(SCRIPT_GENERATION_PROMPT, {
      scenes: JSON.stringify(this.results.scenes).slice(0, 8000),
      characters: JSON.stringify(this.results.characters).slice(0, 3000),
      sourceText: summary,
    }, generationModel)
    this.results.yaml = OutputParser.extractYaml(yamlRaw)
    this.emit("agent-done", "ScriptGeneration", { yamlContent: this.results.yaml })

    // ═══ Step 6: YAML Validation ═══
    this.currentStep = 6
    this.emit("agent-start", "YamlValidation")
    const validRaw = await this.invokeWithRetry(YAML_VALIDATION_PROMPT, {
      yaml: this.results.yaml.slice(0, 12000),
      schemaRules: "必填顶级字段: title, metadata, characters, scenes。场景必填: sceneNumber, location, dialogues。对白必填: speaker, text。",
    }, analysisModel)
    const validation = OutputParser.safeJSON(validRaw) || { valid: false, errors: [{ message: "校验解析失败" }] }
    this.emit("agent-done", "YamlValidation", validation)

    // ═══ Step 6.5: Faithfulness Check ═══
    this.emit("agent-start", "FaithfulnessCheck")
    const faithRaw = await this.invokeWithRetry(FAITHFULNESS_CHECK_PROMPT, {
      yaml: this.results.yaml.slice(0, 10000),
      sourceText: summary,
    }, analysisModel)
    const faithfulness = OutputParser.safeJSON(faithRaw) || { faithful: false, score: 0, issues: ["忠实度解析失败"], summary: "" }
    this.emit("agent-done", "FaithfulnessCheck", faithfulness)
    this.results.faithfulness = faithfulness

    return {
      title: this.results.analysis?.genre || "未命名剧本",
      yamlContent: this.results.yaml,
      characters: this.results.characters?.characters || [],
      scenes: this.results.scenes?.scenes || [],
      faithfulness,
    }
  }

  /** 调用 LLM 并解析 JSON 输出，失败时自动重试 */
  private async invokeWithRetry(promptStr: string, input: Record<string, string>, model: any, retries = JSON_RETRY_MAX): Promise<any> {
    let lastRaw = ""
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const prompt = PromptTemplate.fromTemplate(promptStr)
        const chain = RunnableSequence.from([prompt, model, new StringOutputParser()])
        lastRaw = await chain.invoke(input)

        // 尝试 JSON 解析
        const parsed = OutputParser.safeJSON(lastRaw)
        if (parsed) return parsed

        // 非 JSON 输出但可能是纯 YAML（ScriptGeneration 步骤）
        if (lastRaw.trim().startsWith("title:") || lastRaw.includes("scenes:")) {
          return lastRaw
        }

        if (attempt < retries) {
          console.warn(`[AgentPipeline] JSON parse failed (attempt ${attempt + 1}/${retries + 1}), retrying...`)
        }
      } catch (err: any) {
        if (attempt < retries) {
          console.warn(`[AgentPipeline] LLM invoke failed (attempt ${attempt + 1}/${retries + 1}): ${err.message}`)
        } else {
          throw err
        }
      }
    }
    // 所有重试用尽 → 返回原始文本
    console.warn(`[AgentPipeline] All retries exhausted, returning raw output`)
    return { raw: lastRaw }
  }

  /** 合并多个分片的分析结果 */
  private mergeAnalysis(results: any[], chunks: TextChunk[]) {
    const genres: string[] = []
    const themes: string[] = []
    const events: any[] = []

    for (const r of results) {
      if (r.genre && r.genre !== "其他") genres.push(r.genre)
      if (r.subGenre) genres.push(r.subGenre)
      if (r.themes) themes.push(...(Array.isArray(r.themes) ? r.themes : []))
      if (r.events) events.push(...(Array.isArray(r.events) ? r.events : []))
    }

    return {
      genre: genres[0] || results[0]?.genre || "未分类",
      subGenre: genres[1] || results[0]?.subGenre || "",
      themes: [...new Set(themes)].slice(0, 10),
      narrativeStyle: results[0]?.narrativeStyle || "未识别",
      toneStyle: results[0]?.toneStyle || "未识别",
      events: events.slice(0, 20),
      totalChunks: chunks.length,
    }
  }
}

export class AIService {
  createPipeline(taskId: string, novelId: string) {
    return new AgentPipeline(taskId, novelId)
  }
}
