import { minioClient, storagePaths, initBuckets } from "@/shared/storage/minio"
import { logger } from "@/utils/logger"

export class StorageService {
  async upload(bucket: string, key: string, body: Buffer, contentType: string): Promise<string> {
    await minioClient.putObject(bucket, key, body, body.length, { "Content-Type": contentType })
    logger.info(`[Storage] Uploaded ${bucket}/${key}`)
    return `/${bucket}/${key}`
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    const stream = await minioClient.getObject(bucket, key)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async delete(bucket: string, key: string): Promise<void> {
    await minioClient.removeObject(bucket, key)
    logger.info(`[Storage] Deleted ${bucket}/${key}`)
  }

  /**
   * 保存小说原文到 MinIO
   */
  async uploadNovel(userId: string, novelId: string, ext: string, buffer: Buffer): Promise<string> {
    const key = storagePaths.novel(userId, novelId, ext)
    return this.upload("novels", key, buffer, "application/octet-stream")
  }

  /**
   * 保存导出文件到 MinIO
   */
  async uploadExport(userId: string, scriptId: string, version: number, format: string, buffer: Buffer, mime: string): Promise<string> {
    const key = storagePaths.export(userId, scriptId, version, format)
    return this.upload("exports", key, buffer, mime)
  }

  /** 启动时初始化 Bucket */
  async init() {
    await initBuckets()
    logger.info("[Storage] Buckets initialized")
  }
}
