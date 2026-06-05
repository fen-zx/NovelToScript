// AI Service — 7 Agent 流水线编排
import { EventEmitter } from "events"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { analysisModel, creativeModel, generationModel } from "@/config/deepseek"
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

  async run() {
    // Step 1: Novel Analysis (分片并行 — 此处简化为单次调用)
    this.currentStep = 1
    this.emit("agent-start", "NovelAnalysis")
    const analysisResult = await this.invokeChain(NOVEL_ANALYSIS_PROMPT, { text: "[TODO: 分片文本]" }, analysisModel)
    this.results.analysis = this.parseJSON(analysisResult)
    this.emit("agent-done", "NovelAnalysis", this.results.analysis)

    // Step 2: Character Extraction
    this.currentStep = 2
    this.emit("agent-start", "CharacterExtraction")
    const charResult = await this.invokeChain(CHARACTER_EXTRACTION_PROMPT, {
      summary: JSON.stringify(this.results.analysis),
      text: "[TODO: 全文摘要]",
    }, analysisModel)
    this.results.characters = this.parseJSON(charResult)
    this.emit("agent-done", "CharacterExtraction", this.results.characters)

    // Step 3: Plot Analysis
    this.currentStep = 3
    this.emit("agent-start", "PlotAnalysis")
    const plotResult = await this.invokeChain(PLOT_ANALYSIS_PROMPT, {
      characters: JSON.stringify(this.results.characters),
      summary: JSON.stringify(this.results.analysis),
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
      schemaRules: "[TODO: Schema rules]",
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
