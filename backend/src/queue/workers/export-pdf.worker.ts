// Export PDF Worker — Puppeteer 渲染
import { Worker } from "bullmq"
import { redisConnection } from "@/shared/queue/queue-manager"
import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { minioClient, storagePaths } from "@/shared/storage/minio"
import { parseScriptYaml, buildHtml, renderPdf } from "@/utils/pdf-renderer"
import { logger } from "@/utils/logger"

const scriptRepo = new ScriptRepository()
const versionRepo = new VersionRepository()

export const exportPdfWorker = new Worker(
  "export-pdf",
  async (job) => {
    const { scriptId, userId } = job.data as { scriptId: string; userId: string }

    const script = await scriptRepo.findById(scriptId)
    if (!script) throw new Error("Script not found")

    const version = await versionRepo.findLatestVersion(scriptId)
    if (!version) throw new Error("No version found")

    // 解析YAML → HTML → PDF
    const scriptData = parseScriptYaml(version.content)
    const html = buildHtml(scriptData)
    const pdfBuffer = await renderPdf(html)

    // 上传 MinIO
    const key = storagePaths.export(userId, scriptId, version.versionNumber, "pdf")
    await minioClient.putObject("exports", key, pdfBuffer, pdfBuffer.length, {
      "Content-Type": "application/pdf",
    })

    const fileName = `${script.title}_剧本_v${version.versionNumber}.pdf`
    logger.info(`[ExportPDF] Generated ${fileName}`)

    return { fileUrl: `/${key}`, fileName }
  },
  { connection: redisConnection, concurrency: 2, lockDuration: 60_000 },
)
