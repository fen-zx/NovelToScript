// Prompt 模板 — Character Extraction
export const CHARACTER_EXTRACTION_PROMPT = `你是一位专业的剧本角色分析师。请从小说中提取所有主要角色。

## 任务
识别所有有名有姓的角色，判断类型（主角/反派/配角），描述外貌性格动机，分析关系。

## 输出格式
严格输出 JSON：{{"characters":[{{"name":"角色名","role":"PROTAGONIST|ANTAGONIST|SUPPORTING","description":"50-100字描述","traits":["特征1"],"motivation":"动机","relationships":[{{"with":"另一角色","type":"师徒|挚友|恋人|敌对|父子"}}]}}]}}

## 小说摘要
{summary}

## 小说全文
{text}`
