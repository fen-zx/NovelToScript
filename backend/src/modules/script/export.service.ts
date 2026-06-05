import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { Errors } from "@/shared/errors/error-codes"
import { exportPdfQueue } from "@/shared/queue/queue-manager"
import type { ExportFormat } from "@/shared/dto/request.dto"

export class ExportService {
  constructor(
    private scriptRepo = new ScriptRepository(),
    private versionRepo = new VersionRepository(),
  ) {}

  async exportScript(scriptId: string, format: ExportFormat) {
    const script = await this.scriptRepo.findById(scriptId)
    if (!script) throw Errors.scriptNotFound()

    const version = await this.versionRepo.findLatestVersion(scriptId)
    if (!version) throw Errors.versionNotFound()

    const fileName = `${script.title}_剧本_v${version.versionNumber}`

    switch (format) {
      case "yaml":
        return { content: version.content, mime: "text/yaml", fileName: `${fileName}.yaml` }
      case "json":
        return { content: JSON.stringify({ title: script.title, yaml: version.content }, null, 2), mime: "application/json", fileName: `${fileName}.json` }
      case "txt":
        return { content: version.content, mime: "text/plain", fileName: `${fileName}.txt` }
      case "md":
        return { content: this.toMarkdown(script.title, version.content), mime: "text/markdown", fileName: `${fileName}.md` }
      case "pdf": {
        // 入队 export-pdf — Worker 用 Puppeteer 渲染 PDF
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

  private toMarkdown(title: string, yaml: string): string {
    return `# ${title}\n\n\`\`\`yaml\n${yaml}\n\`\`\``
  }
}
