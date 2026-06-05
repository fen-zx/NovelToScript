// 所有 Worker 入口 — 由 `npm run worker` 启动
import "./generate-script.worker"
import "./polish-script.worker"
import "./export-pdf.worker"
import "./cleanup.worker"

console.log("[Worker] All 4 workers started")
