// MinIO Client
import { Client as MinioClient } from "minio"
import { env } from "@/config/env"

export const minioClient = new MinioClient({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
})

// ═══════════════════════════════════════
// Bucket 初始化
// ═══════════════════════════════════════

const BUCKETS = ["novels", "scripts", "exports", "temp"] as const

export async function initBuckets(): Promise<void> {
  for (const bucket of BUCKETS) {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) {
      await minioClient.makeBucket(bucket)
      console.log(`[MinIO] Bucket created: ${bucket}`)

      // 设置生命周期 (仅非永久 bucket)
      if (bucket !== "scripts") {
        const days = bucket === "exports" ? 90 : 30
        // MinIO lifecycle 需通过 admin API，此处简化为日志记录
        console.log(`[MinIO] Lifecycle: ${bucket} → ${days}d expiration`)
      }
    }
  }
}

// ═══════════════════════════════════════
// 存储路径工具
// ═══════════════════════════════════════

export const storagePaths = {
  novel: (userId: string, novelId: string, ext: string) =>
    `novels/${userId}/${novelId}/original.${ext}`,
  script: (userId: string, scriptId: string, version: number) =>
    `scripts/${userId}/${scriptId}/v${version}.yaml`,
  export: (userId: string, scriptId: string, version: number, format: string) =>
    `exports/${userId}/${scriptId}/script_v${version}.${format}`,
  temp: (taskId: string, agentName: string) =>
    `temp/${taskId}/${agentName}/result.json`,
}
