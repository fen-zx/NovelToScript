// Prompt 模板 — Novel Analysis
export const NOVEL_ANALYSIS_PROMPT = `你是一位资深文学编辑。请分析以下小说片段，提取关键信息。

## 任务
1. 识别小说的文学风格和类型 (genre)
2. 归纳核心主题 (themes)
3. 描述叙事风格特点

## 输出格式
严格输出 JSON：{"genre":"仙侠|都市|科幻|历史|悬疑|言情|武侠|其他","subGenre":"子类型","themes":["主题1"],"narrativeStyle":"第一人称|第三人称|多视角","toneStyle":"严肃|轻松|幽默|悲情|热血","events":[{"summary":"简述","importance":"major|minor"}]}

## 文本
{text}`
