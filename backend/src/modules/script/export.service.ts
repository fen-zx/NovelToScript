import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { CharacterRepository } from "@/modules/script/character.repository"
import { Errors } from "@/shared/errors/error-codes"
import { exportPdfQueue } from "@/shared/queue/queue-manager"
import { stringify } from "yaml"
import type { ExportFormat } from "@/shared/dto/request.dto"

export class ExportService {
  constructor(
    private scriptRepo = new ScriptRepository(),
    private versionRepo = new VersionRepository(),
    private characterRepo = new CharacterRepository(),
  ) {}

  async exportScript(scriptId: string, format: ExportFormat) {
    const script = await this.scriptRepo.findById(scriptId)
    if (!script) throw Errors.scriptNotFound()

    const version = await this.versionRepo.findLatestVersion(scriptId)
    if (!version) throw Errors.versionNotFound()

    // 从 DB 获取角色并合并到 YAML 中
    const characters = await this.characterRepo.findByScriptId(scriptId)
    const enrichedYaml = this.injectCharacters(version.content, characters)

    const fileName = `${script.title}_剧本_v${version.versionNumber}`

    switch (format) {
      case "yaml":
        return { content: enrichedYaml, mime: "text/yaml", fileName: `${fileName}.yaml` }
      case "json":
        return { content: JSON.stringify({ title: script.title, yaml: enrichedYaml }, null, 2), mime: "application/json", fileName: `${fileName}.json` }
      case "txt":
        return { content: enrichedYaml, mime: "text/plain", fileName: `${fileName}.txt` }
      case "md":
        return { content: this.toMarkdown(script.title, enrichedYaml), mime: "text/markdown", fileName: `${fileName}.md` }
      case "pdf": {
        // 入队 export-pdf — Worker 用 Puppeteer 渲染 PDF（也用富化后的 YAML）
        const job = await exportPdfQueue.add("export", {
          scriptId,
          userId: script.userId,
          format: "pdf" as const,
        })
        return { taskId: job.id!, status: "QUEUED", fileName: `${fileName}.pdf`, mime: "application/pdf" }
      }
      default:
        throw Errors.validation("不支持的导出格式")
    }
  }

  /** 将角色数据注入 YAML，若已有 characters 块则跳过 */
  private injectCharacters(yamlContent: string, characters: any[]): string {
    if (!characters.length) return yamlContent

    // 已有 characters 块则不再重复注入
    if (/^\s*characters:\s*$/m.test(yamlContent)) return yamlContent

    const charBlock = stringify({ characters: characters.map((c: any) => ({
      name: c.name,
      role: c.role,
      description: c.description || undefined,
      traits: c.traits ? (typeof c.traits === "string" ? JSON.parse(c.traits) : c.traits) : undefined,
    })) })

    // 在 scenes: 之前插入
    const scenesIdx = yamlContent.indexOf("\nscenes:")
    if (scenesIdx === -1) return yamlContent

    return yamlContent.slice(0, scenesIdx) + "\n" + charBlock + yamlContent.slice(scenesIdx)
  }

  private toMarkdown(title: string, yaml: string): string {
    return `# ${title}\n\n\`\`\`yaml\n${yaml}\n\`\`\``
  }
}
