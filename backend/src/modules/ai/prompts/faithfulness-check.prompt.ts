// Prompt 模板 — Faithfulness Check (忠实度校验)
// 比对生成剧本与原文，检测是否存在编造内容
export const FAITHFULNESS_CHECK_PROMPT = `你是一位严格的剧本审核员。请比对生成的剧本和小说原文，检查剧本中是否存在原文中没有的内容。

## 检查项
1. **角色**: 剧本中出现的角色是否都在原文中存在？有无凭空添加的角色？
2. **对白**: 剧本中的对话内容是否在原文中有依据？有无完全编造的对话？
3. **情节**: 剧本中的情节走向是否与原文一致？有无新增或篡改的情节？
4. **场景**: 剧本中的场景地点/时间是否与原文吻合？
5. **关系**: 角色之间的关系是否符合原文设定？

## 输出格式
严格输出 JSON：
{{
  "faithful": true,
  "score": 95,
  "issues": [
    {{
      "type": "HALLUCINATED_CHARACTER|HALLUCINATED_DIALOGUE|HALLUCINATED_PLOT|HALLUCINATED_SCENE|HALLUCINATED_RELATION",
      "severity": "critical|major|minor",
      "location": "场景X 或 角色名",
      "detail": "具体问题描述",
      "suggestion": "修复建议"
    }}
  ],
  "summary": "总体评价(50字内)"
}}

## 原文参考(采样)
{sourceText}

## 待审核剧本 YAML
{yaml}`

// 润色忠实度检查 — 检查润色后是否改变了原意
export const POLISH_FAITHFULNESS_PROMPT = `你是一位剧本审核员。请比对润色后的剧本和原始剧本，检查润色是否改变了核心内容。

## 检查项
1. 角色名、数量是否一致
2. 对白核心意思是否改变
3. 情节走向是否一致
4. 无新增场景或角色

## 输出格式
{{ "faithful": true, "issues": [], "summary": "..." }}

## 原始剧本
{originalYaml}

## 润色后剧本
{polishedYaml}`
