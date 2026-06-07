// PDF 渲染器 — YAML剧本 → HTML → PDF (Puppeteer)
import { parse as parseYaml } from "yaml"

interface ScriptData {
  title: string
  metadata: { author?: string; genre?: string; totalScenes: number }
  characters: Array<{ name: string; role: string; description?: string }>
  scenes: Array<{
    sceneNumber: number
    location: string
    time?: string
    participants?: string[]
    description?: string
    dialogues: Array<{ speaker: string; text: string; action?: string; emotion?: string }>
    stageDirections?: string[]
  }>
}

/** 从 YAML 字符串解析剧本数据 */
export function parseScriptYaml(yamlContent: string): ScriptData {
  const data = parseYaml(yamlContent) as any
  return {
    title: data.title || "未命名剧本",
    metadata: data.metadata || { totalScenes: data.scenes?.length || 0 },
    characters: data.characters || [],
    scenes: (data.scenes || []).map((s: any) => ({
      sceneNumber: s.sceneNumber || 0,
      location: s.location || "",
      time: s.time,
      participants: s.participants,
      description: s.description,
      dialogues: s.dialogues || [],
      stageDirections: s.stageDirections,
    })),
  }
}

/** 构建打印友好的 HTML */
export function buildHtml(script: ScriptData): string {
  const { title, metadata, characters, scenes } = script

  const characterList = characters.map(c =>
    `<div class="char"><strong>${escapeHtml(c.name)}</strong> (${c.role === "PROTAGONIST" ? "主角" : c.role === "ANTAGONIST" ? "反派" : "配角"})${c.description ? ` — ${escapeHtml(c.description)}` : ""}</div>`
  ).join("")

  const sceneHtml = scenes.map(s => `
    <div class="scene">
      <h2>第${s.sceneNumber}场</h2>
      <div class="scene-meta">
        <span>📍 ${escapeHtml(s.location)}</span>
        ${s.time ? `<span>🕐 ${escapeHtml(s.time)}</span>` : ""}
        ${s.participants?.length ? `<span>👥 ${s.participants.map(escapeHtml).join("、")}</span>` : ""}
      </div>
      ${s.description ? `<p class="scene-desc">${escapeHtml(s.description)}</p>` : ""}
      <div class="dialogues">
        ${s.dialogues.map(d => `
          <div class="dialogue">
            <span class="speaker">${escapeHtml(d.speaker)}${d.emotion ? `（${escapeHtml(d.emotion)}）` : ""}:</span>
            <span class="text">${escapeHtml(d.text)}</span>
            ${d.action ? `<span class="action">[${escapeHtml(d.action)}]</span>` : ""}
          </div>
        `).join("")}
      </div>
      ${s.stageDirections?.length ? `<div class="directions">${s.stageDirections.map(d => `<p>🎬 ${escapeHtml(d)}</p>`).join("")}</div>` : ""}
    </div>
  `).join("")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: "Noto Serif CJK SC", "SimSun", serif; font-size:14px; line-height:2; padding:40px 60px; color:#222; }
  h1 { text-align:center; font-size:24px; margin-bottom:8px; }
  .meta { text-align:center; color:#666; margin-bottom:32px; font-size:13px; }
  .characters { margin-bottom:32px; padding:16px; background:#f9f9f9; border-radius:4px; }
  .char { padding:4px 0; }
  .scene { margin-bottom:28px; page-break-inside:avoid; }
  .scene h2 { font-size:18px; border-bottom:2px solid #333; padding-bottom:4px; margin-bottom:8px; }
  .scene-meta { display:flex; gap:16px; color:#555; font-size:13px; margin-bottom:8px; }
  .scene-desc { color:#444; font-style:italic; margin-bottom:8px; }
  .dialogues { margin:8px 0; }
  .dialogue { padding:4px 0; }
  .speaker { font-weight:bold; margin-right:8px; }
  .action { color:#888; font-size:12px; margin-left:8px; }
  .directions { margin-top:8px; color:#666; font-size:13px; }
  @media print { body { padding:20px 40px; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">
  ${metadata.author ? `<span>作者: ${escapeHtml(metadata.author)}</span>` : ""}
  ${metadata.genre ? `<span> | 类型: ${escapeHtml(metadata.genre)}</span>` : ""}
  <span> | 共${metadata.totalScenes}场</span>
</div>
${characters.length ? `<div class="characters"><h3>人物表</h3>${characterList}</div>` : ""}
${sceneHtml}
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 使用 Puppeteer 渲染 PDF，若不可用则回退到 HTML Buffer */
export async function renderPdf(html: string): Promise<Buffer> {
  try {
    // puppeteer 为可选依赖，仅在 Docker 生产环境安装
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require("puppeteer")
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE || undefined,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20mm", bottom: "20mm" } })
    await browser.close()
    return Buffer.from(pdf)
  } catch {
    // 回退：返回 HTML 内容（前端可直接展示）
    return Buffer.from(html, "utf-8")
  }
}
