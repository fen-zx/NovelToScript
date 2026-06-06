// AI Service — 7 Agent 流水线编排
import { EventEmitter } from "events"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel, creativeModel, generationModel } from "@/config/deepseek"
import { chunkNovel, type TextChunk } from "./text-chunker"
import { NOVEL_ANALYSIS_PROMPT } from "./prompts/novel-analysis.prompt"
import { CHARACTER_EXTRACTION_PROMPT } from "./prompts/character-extraction.prompt"
import { PLOT_ANALYSIS_PROMPT } from "./prompts/plot-analysis.prompt"
import { SCENE_PLANNING_PROMPT } from "./prompts/scene-planning.prompt"
import { SCRIPT_GENERATION_PROMPT } from "./prompts/script-generation.prompt"
import { YAML_VALIDATION_PROMPT } from "./prompts/yaml-validation.prompt"

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

    // Step 1: Novel Analysis — 分片并行分析，合并结果
    this.currentStep = 1
    this.emit("agent-start", "NovelAnalysis")
    const analysisResults = await Promise.all(
      chunks.map((chunk, i) =>
        this.invokeChain(NOVEL_ANALYSIS_PROMPT, {
          text: chunk.text,
          part: `第${i + 1}/${chunks.length}部分`,
          chapterRef: chunk.chapterRef || "正文",
        }, analysisModel).then(r => ({ ...this.parseJSON(r), chunkIndex: i }))
      )
    )
    this.results.analysis = this.mergeAnalysis(analysisResults, chunks)
    this.emit("agent-done", "NovelAnalysis", this.results.analysis)

    // 构建全文摘要（取前 6000 字 + 分析结果）
    const summary = fullText.slice(0, 6000)
    const analysisSummary = JSON.stringify(this.results.analysis)

    // Step 2: Character Extraction
    this.currentStep = 2
    this.emit("agent-start", "CharacterExtraction")
    const charResult = await this.invokeChain(CHARACTER_EXTRACTION_PROMPT, {
      summary: analysisSummary,
      text: summary,
    }, analysisModel)
    this.results.characters = this.parseJSON(charResult)
    this.emit("agent-done", "CharacterExtraction", this.results.characters)

    // Step 3: Plot Analysis
    this.currentStep = 3
    this.emit("agent-start", "PlotAnalysis")
    const plotResult = await this.invokeChain(PLOT_ANALYSIS_PROMPT, {
      characters: JSON.stringify(this.results.characters),
      summary: analysisSummary,
    }, analysisModel)
    this.results.plot = this.parseJSON(plotResult)
    this.emit("agent-done", "PlotAnalysis", this.results.plot)

    // Step 4: Scene Planning
    this.currentStep = 4
    this.emit("agent-start", "ScenePlanning")
    const sceneResult = await this.invokeChain(SCENE_PLANNING_PROMPT, {
      plotAnalysis: JSON.stringify(this.results.plot),
      characters: JSON.stringify(this.results.characters),
    }, creativeModel)
    this.results.scenes = this.parseJSON(sceneResult)
    this.emit("agent-done", "ScenePlanning", this.results.scenes)

    // Step 5: Script Generation
    this.currentStep = 5
    this.emit("agent-start", "ScriptGeneration")
    const yamlResult = await this.invokeChain(SCRIPT_GENERATION_PROMPT, {
      scenes: JSON.stringify(this.results.scenes),
      characters: JSON.stringify(this.results.characters),
    }, generationModel)
    this.results.yaml = this.extractYaml(yamlResult)
    this.emit("agent-done", "ScriptGeneration", { yamlContent: this.results.yaml })

    // Step 6: YAML Validation
    this.currentStep = 6
    this.emit("agent-start", "YamlValidation")
    const validResult = await this.invokeChain(YAML_VALIDATION_PROMPT, {
      yaml: this.results.yaml,
      schemaRules: "必填字段: title, scenes。场景必填: sceneNumber, location, dialogues",
    }, analysisModel)
    const validation = this.parseJSON(validResult)
    this.emit("agent-done", "YamlValidation", validation)

    return {
      title: this.results.analysis?.genre || "未命名剧本",
      yamlContent: this.results.yaml,
      characters: this.results.characters?.characters || [],
      scenes: this.results.scenes?.scenes || [],
    }
  }

  /** 合并多个分片的分析结果 */
  private mergeAnalysis(results: any[], chunks: TextChunk[]) {
    const genres = new Set<string>()
    const themes = new Set<string>()
    const keyEvents: string[] = []
    for (const r of results) {
      if (r.genre) genres.add(r.genre)
      if (r.themes) (Array.isArray(r.themes) ? r.themes : [r.themes]).forEach((t: string) => themes.add(t))
      if (r.keyEvents) keyEvents.push(...(Array.isArray(r.keyEvents) ? r.keyEvents : [r.keyEvents]))
    }
    return {
      genre: [...genres][0] || "未分类",
      themes: [...themes],
      style: results[0]?.style || "未识别",
      outline: results.map(r => r.outline || r.summary || "").join("\n"),
      keyEvents: keyEvents.slice(0, 20),
      totalChunks: chunks.length,
    }
  }

  private async invokeChain(promptStr: string, input: Record<string, string>, model: any): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(promptStr)
    const chain = RunnableSequence.from([prompt, model, new StringOutputParser()])
    return chain.invoke(input)
  }

  private parseJSON(raw: string): any {
    try {
      return JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())
    } catch {
      return raw
    }
  }

  private extractYaml(raw: string): string {
    return raw.replace(/```yaml\n?/g, "").replace(/```\n?/g, "").trim()
  }
}

export class AIService {
  createPipeline(taskId: string, novelId: string) {
    return new AgentPipeline(taskId, novelId)
  }
}
