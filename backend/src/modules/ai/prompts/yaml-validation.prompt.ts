// Prompt 模板 — YAML Validation
export const YAML_VALIDATION_PROMPT = `你是 YAML 格式校验专家。请检查剧本 YAML 是否符合规范。

## 校验规则
{schemaRules}

## 输出格式
{{"valid":true,"errors":[],"warnings":[],"suggestions":[]}}
若发现错误: {{"valid":false,"errors":[{{"line":行号,"field":"字段路径","message":"描述","severity":"error|warning"}}]}}

## 待校验 YAML
{yaml}`
