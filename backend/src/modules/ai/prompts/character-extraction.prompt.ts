// Prompt 模板 — Character Extraction
export const CHARACTER_EXTRACTION_PROMPT = `你是一位专业的剧本角色分析师。请从小说中提取所有主要角色。

## ⚠️ 重要约束
1. 严格仅基于下面提供的文本内容提取角色。不得凭空编造角色、关系或特征
2. **禁止使用你对知名角色的先验知识**：即使你认出文本来自某知名作品，也只提取本次提供的片段中实际出现的角色，不要添加训练数据中你知道但文本中未出现的角色
3. 每个角色必须能在原文中找到明确依据。如果无法确定某个字段，使用"未知"

## 任务
识别所有有名有姓的角色，判断类型（主角/反派/配角），描述外貌性格动机，分析关系。

## 输出格式
严格输出 JSON：{{"characters":[{{"name":"角色名","role":"PROTAGONIST|ANTAGONIST|SUPPORTING","description":"50-100字描述","traits":["特征1"],"motivation":"动机","relationships":[{{"with":"另一角色","type":"师徒|挚友|恋人|敌对|父子"}}]}}]}}

## 小说摘要
{summary}

## 小说全文(采样)
{text}`
