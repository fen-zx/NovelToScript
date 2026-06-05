// AI 输出解析器 — JSON/YAML 提取
export class OutputParser {
  /** 从 LLM 原始输出中提取 JSON */
  static parseJSON<T>(raw: string, fallback?: T): T {
    try {
      const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim()
      return JSON.parse(cleaned)
    } catch {
      if (fallback !== undefined) return fallback
      throw new OutputParseError("JSON parse failed")
    }
  }

  /** 从 LLM 原始输出中提取 YAML */
  static extractYaml(raw: string): string {
    // 尝试提取 ```yaml 代码块
    const match = raw.match(/```ya?ml\s*\n?([\s\S]*?)\n?```/)
    if (match) return match[1].trim()

    // 无代码块则返回原始内容
    return raw.replace(/```\s*/g, "").trim()
  }

  /** 安全解析，失败返回 null */
  static safeJSON<T>(raw: string): T | null {
    try { return this.parseJSON<T>(raw) } catch { return null }
  }
}

export class OutputParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OutputParseError"
  }
}
