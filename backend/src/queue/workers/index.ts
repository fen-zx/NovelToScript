// 所有 Worker 入口 — 由 `npm run worker` 启动
import "./generate-script.worker"
import "./polish-script.worker"
import "./export-pdf.worker"
import "./cleanup.worker"
import { scheduleCleanupJob } from "@/shared/queue/queue-manager"

scheduleCleanupJob().then(() => {
  console.log("[Worker] All 4 workers + cleanup cron started")
})
