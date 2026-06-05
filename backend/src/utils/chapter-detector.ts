// 章节识别器 — 五级兜底策略
const BUILTIN_PATTERNS = [
  /^第[零一二三四五六七八九十百千万两\d]+章.*$/,
  /^第[零一二三四五六七八九十百千万两\d]+节.*$/,
  /^第[零一二三四五六七八九十百千万两\d]+回.*$/,
  /^第.*卷.*$/,
  /^Chapter\s+\d+.*$/i,
  /^\d+$/,
]

export interface ChapterBoundary {
  index: number
  title: string
  start: number
  end: number
}

export function detectChapters(text: string, customPattern?: string): ChapterBoundary[] {
  const patterns = customPattern
    ? [new RegExp(customPattern), ...BUILTIN_PATTERNS]
    : BUILTIN_PATTERNS

  // 找到所有匹配的章节标题位置
  const matches: { title: string; pos: number }[] = []
  const lines = text.split("\n")

  for (const pattern of patterns) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].trim().match(pattern)
      if (match && !matches.some(m => m.pos === i)) {
        matches.push({ title: match[0], pos: i })
      }
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.pos - b.pos)

  // 计算章节边界
  const chapters: ChapterBoundary[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = lines.slice(0, matches[i].pos).join("\n").length + 1
    const end = i < matches.length - 1
      ? lines.slice(0, matches[i + 1].pos).join("\n").length
      : text.length
    chapters.push({ index: i + 1, title: matches[i].title, start, end })
  }

  return chapters
}

export function calculateHitRate(chapters: ChapterBoundary[], totalLines: number): number {
  if (totalLines === 0) return 0
  const coveredLines = chapters.reduce((sum, c) => sum + (c.end - c.start), 0)
  return Math.min(1, coveredLines / textToLines(coveredLines, totalLines))
}

function textToLines(_chars: number, _totalLines: number): number {
  return _chars / (_chars / Math.max(1, _totalLines))
}
