// 文本分片器 — 三级分片策略
import { detectChapters, type ChapterBoundary } from "@/utils/chapter-detector"

export interface TextChunk {
  index: number
  text: string
  chapterRef?: string
  estimatedTokens: number
}

export function chunkNovel(fullText: string): TextChunk[] {
  const chapters = detectChapters(fullText)
  const chunks: TextChunk[] = []

  // 无章节识别 → 按 5000 字均匀切片
  if (chapters.length === 0) {
    const size = 5000
    for (let i = 0; i < fullText.length; i += size) {
      chunks.push({
        index: chunks.length,
        text: fullText.slice(i, i + size),
        estimatedTokens: Math.ceil(size * 2), // 中文 ~2 tokens/字
      })
    }
    return chunks
  }

  // 有章节 → 按章节边界分片
  for (const chapter of chapters) {
    const chapterText = fullText.slice(chapter.start, chapter.end)

    if (chapterText.length <= 8000) {
      chunks.push({
        index: chunks.length,
        text: chapterText,
        chapterRef: chapter.title,
        estimatedTokens: Math.ceil(chapterText.length * 2),
      })
    } else {
      // 章节 > 8000 字 → 按段落边界再切
      const subChunks = splitByParagraph(chapterText, 8000, 200)
      chunks.push(...subChunks.map((text, i) => ({
        index: chunks.length,
        text,
        chapterRef: `${chapter.title}(分片${i + 1})`,
        estimatedTokens: Math.ceil(text.length * 2),
      })))
    }
  }

  return chunks
}

function splitByParagraph(text: string, maxChars: number, overlap: number): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ""

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current)
      // Overlap: 保留上一块的末尾
      const lastPara = current.split(/\n\n+/).pop() || ""
      current = lastPara.slice(-overlap) + "\n\n" + para
    } else {
      current += (current ? "\n\n" : "") + para
    }
  }
  if (current) chunks.push(current)

  return chunks
}

export function estimateTokens(text: string): number {
  // 简单估算: 中文字符 ~2 tokens, 英文单词 ~1.3 tokens
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 2 + otherChars * 0.5)
}

/**
 * 构建智能摘要：从全文均匀采样关键段落，而非仅截取开头
 * 策略：开头(30%) + 中间(40%，均匀采样) + 结尾(30%)
 */
export function buildSmartSummary(fullText: string, maxChars: number = 20000): string {
  if (fullText.length <= maxChars) return fullText

  const headLen = Math.floor(maxChars * 0.30)
  const tailLen = Math.floor(maxChars * 0.30)
  const midLen = maxChars - headLen - tailLen

  const head = fullText.slice(0, headLen)
  const tail = fullText.slice(fullText.length - tailLen)

  // 中间段：均匀采样 N 个片段
  const midStart = headLen
  const midEnd = fullText.length - tailLen
  const midRange = midEnd - midStart

  if (midRange <= midLen) {
    // 中间段本身就不长，直接取
    const mid = fullText.slice(midStart, midEnd)
    return head + "\n\n...（中间段落摘要）...\n\n" + mid + "\n\n...\n\n" + tail
  }

  // 均匀采样 4 个中间片段
  const sampleCount = 4
  const sampleSize = Math.floor(midLen / sampleCount)
  const step = Math.floor(midRange / sampleCount)

  const midSamples: string[] = []
  for (let i = 0; i < sampleCount; i++) {
    const start = midStart + i * step
    const end = Math.min(start + sampleSize, midEnd)
    midSamples.push(fullText.slice(start, end))
  }

  return head + "\n\n...（中间段落摘要）...\n\n" + midSamples.join("\n\n...\n\n") + "\n\n...\n\n" + tail
}

/**
 * 根据场景引用的章节号，从原文中检索相关片段
 * 用于 Steps 4-5 注入原文上下文，防止 AI 编造
 */
export function retrieveSourcePassages(
  fullText: string,
  chapters: { title: string; start: number; end: number }[],
  sceneChapterRefs: string[],
  maxChars: number = 12000,
): string {
  if (chapters.length === 0 || sceneChapterRefs.length === 0) {
    // 无法按章节匹配时，退回智能摘要
    return buildSmartSummary(fullText, maxChars)
  }

  // 从场景引用中提取章节号
  const chapterNums = new Set<number>()
  for (const ref of sceneChapterRefs) {
    const match = ref.match(/第(\d+)[章节]/)
    if (match) chapterNums.add(parseInt(match[1], 10))
  }

  if (chapterNums.size === 0) {
    return buildSmartSummary(fullText, maxChars)
  }

  // 收集相关章节文本
  const passages: string[] = []
  let totalChars = 0

  for (const num of chapterNums) {
    const idx = num - 1
    if (idx >= 0 && idx < chapters.length) {
      const ch = chapters[idx]
      const chText = fullText.slice(ch.start, ch.end)
      // 每章最多取 3000 字
      const snippet = chText.length > 3000
        ? chText.slice(0, 1500) + "\n...\n" + chText.slice(chText.length - 1500)
        : chText

      if (totalChars + snippet.length <= maxChars) {
        passages.push(`--- ${ch.title} ---\n${snippet}`)
        totalChars += snippet.length
      } else {
        break
      }
    }
  }

  return passages.length > 0
    ? passages.join("\n\n")
    : buildSmartSummary(fullText, maxChars)
}
