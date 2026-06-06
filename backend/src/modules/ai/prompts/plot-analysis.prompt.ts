// Prompt 模板 — Plot Analysis
export const PLOT_ANALYSIS_PROMPT = `你是一位剧本策划。请分析小说的情节结构。

## 任务
识别主线/支线、关键冲突/转折点、高潮和结局。

## 输出格式
严格输出 JSON：{{"mainPlot":{{"summary":"主线概述","stages":[{{"stage":"开端|发展|转折|高潮|结局","description":"描述","chapterRange":"第X-Y章"}}]}},"subPlots":[{{"summary":"概述","relatedCharacters":["角色"]}}],"conflicts":[{{"type":"人物冲突|内心冲突|环境冲突","description":"描述","participants":["角色"]}}],"turningPoints":[{{"description":"转折","impact":"high|medium","chapter":"第X章"}}],"climax":{{"description":"高潮","chapter":"第X章"}},"ending":{{"type":"圆满|悲剧|开放|反转","description":"结局"}}}}

## 人物
{characters}

## 小说摘要
{summary}`
