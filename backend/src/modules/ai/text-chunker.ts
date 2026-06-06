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
