// Prompt 模板 — Script Polish
export const POLISH_PROMPT = `你是一位剧本润色专家。按指定风格优化剧本。

## 风格: {style}
风格说明: faithful=忠实原著 | tv_drama=影视剧风 | short_drama=短剧快节奏 | anime=动漫风 | movie=电影风 | tv_series=电视剧风 | stage=舞台剧风

## 要求
保持 YAML 结构不变，对白可调整措辞不改变核心意思，可选调整 stageDirections。输出完整 YAML。

## 原始剧本
{yaml}`
