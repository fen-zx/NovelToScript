/**
 * 端到端验证脚本 — 润色 + 导出
 *
 * 使用方式:
 *   1. docker compose up -d        # 启动 Redis + MinIO + Backend
 *   2. cd backend && npx tsx scripts/verify-e2e.ts
 *
 * 前置条件:
 *   - Redis/MinIO 服务运行中
 *   - 已创建用户并获取 token
 *   - 已导入小说并创建任务
 *   - 已生成至少一个剧本 scriptId
 */

const BASE = "http://localhost:3000/api"
const TOKEN = process.env.TEST_TOKEN || ""  // 需手动设置: export TEST_TOKEN=xxx

async function main() {
  console.log("═══════════════════════════════════════")
  console.log("  NovelToScript 端到端验证")
  console.log("═══════════════════════════════════════\n")

  // ═══ T-067: 润色验证 ═══
  console.log("── T-067: 7 风格润色验证 ──\n")

  const styles = [
    "faithful", "tv_drama", "short_drama", "anime",
    "movie", "tv_series", "stage",
  ]

  // 需要有 scriptId，从环境变量读取
  const scriptId = process.env.TEST_SCRIPT_ID
  if (!scriptId) {
    console.log("⚠️  跳过润色测试: 设置 TEST_SCRIPT_ID 环境变量")
  } else {
    for (const style of styles) {
      console.log(`  🎨 测试 ${style}...`)
      try {
        const res = await fetch(`${BASE}/scripts/${scriptId}/polish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ style }),
        })
        const data = await res.json()
        if (data.code === 0) {
          console.log(`     ✅ ${style}: 已入队 (taskId: ${data.data?.taskId})`)
        } else {
          console.log(`     ❌ ${style}: ${data.message}`)
        }
      } catch (e: any) {
        console.log(`     ❌ ${style}: ${e.message}`)
      }
    }
  }


  // ═══ T-068: 导出验证 ═══
  console.log("\n── T-068: 多格式导出验证 ──\n")

  const formats = [
    { fmt: "yaml", mime: "text/yaml" },
    { fmt: "json", mime: "application/json" },
    { fmt: "md", mime: "text/markdown" },
    { fmt: "txt", mime: "text/plain" },
    { fmt: "pdf", mime: "application/pdf" },
  ]

  if (!scriptId) {
    console.log("⚠️  跳过导出测试: 设置 TEST_SCRIPT_ID 环境变量")
  } else {
    for (const { fmt, mime } of formats) {
      console.log(`  📤 测试 ${fmt}...`)
      try {
        const res = await fetch(`${BASE}/scripts/${scriptId}/export?format=${fmt}`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        })
        if (fmt === "pdf") {
          const data = await res.json()
          if (data.code === 0) {
            console.log(`     ✅ ${fmt}: 已入队 (taskId: ${data.data?.taskId})`)
          } else {
            console.log(`     ❌ ${fmt}: ${data.message}`)
          }
        } else {
          const contentType = res.headers.get("content-type") || ""
          const text = await res.text()
          if (text.length > 20 && contentType.includes(mime)) {
            console.log(`     ✅ ${fmt}: ${text.length} chars, mime=${mime}`)
          } else {
            console.log(`     ❌ ${fmt}: 内容异常 (${text.length} chars, mime=${contentType})`)
          }
        }
      } catch (e: any) {
        console.log(`     ❌ ${fmt}: ${e.message}`)
      }
    }
  }


  // ═══ 汇总 ═══
  console.log("\n═══════════════════════════════════════")
  console.log("  验证完成。")
  console.log("  完整的润色效果需在浏览器中对比原文与润色后版本。")
  console.log("═══════════════════════════════════════\n")
}

main().catch(console.error)
