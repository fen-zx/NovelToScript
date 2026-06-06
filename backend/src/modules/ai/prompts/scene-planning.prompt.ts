// Prompt 模板 — Scene Planning
export const SCENE_PLANNING_PROMPT = `你是一位影视场景规划师。请将小说情节拆解为剧本场景。

## ⚠️ 重要约束
1. 严格仅基于下面提供的情节分析和原文片段来规划场景。不得凭空添加不存在的场景、地点或人物。每个场景必须能在情节分析或原文中找到依据
2. **禁止使用你对知名作品的先验知识**：不要添加训练数据中你知道但本次未提供的场景或情节

## 任务
按时间/空间划分场景，标注地点、时间、参与者、目标。

## 输出格式
严格输出 JSON：{{"scenes":[{{"sceneNumber":1,"location":"地点","time":"时间描述","participants":["角色"],"goal":"叙事目标(30字)","summary":"内容简述(50-100字)","sourceChapter":"第X章","mood":"紧张|温馨|悲伤|欢乐|悬疑|平静|激烈"}}]}}

## 情节分析
{plotAnalysis}

## 人物
{characters}

## 原文参考(采样)
{sourceText}`
