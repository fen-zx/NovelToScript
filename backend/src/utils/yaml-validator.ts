// YAML Schema 校验器
import { parse as parseYaml } from "yaml"

export interface ValidationError {
  line: number
  field: string
  message: string
  severity: "error" | "warning"
}

const SCHEMA_RULES = {
  requiredTopFields: ["title", "scenes"],
  requiredSceneFields: ["sceneNumber", "location", "dialogues"],
  requiredDialogueFields: ["speaker", "text"],
}

export function validateYaml(yamlStr: string, _schemaRules?: string): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  try {
    const parsed = parseYaml(yamlStr)

    // 必填顶级字段
    for (const field of SCHEMA_RULES.requiredTopFields) {
      if (!(field in (parsed || {}))) {
        errors.push({ line: 0, field, message: `缺少必填字段: ${field}`, severity: "error" })
      }
    }

    // 场景校验
    if (parsed?.scenes) {
      for (let i = 0; i < parsed.scenes.length; i++) {
        const scene = parsed.scenes[i]
        for (const field of SCHEMA_RULES.requiredSceneFields) {
          if (!(field in scene)) {
            errors.push({ line: 0, field: `scenes[${i}].${field}`, message: `场景 ${i + 1} 缺少字段`, severity: "error" })
          }
        }
      }
    }
  } catch (err: any) {
    errors.push({ line: 0, field: "yaml", message: `YAML 解析失败: ${err.message}`, severity: "error" })
  }

  return { valid: errors.length === 0, errors }
}
