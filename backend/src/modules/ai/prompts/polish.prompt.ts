// Prompt 模板 — Script Polish
export const POLISH_PROMPT = `你是一位专业剧本润色专家。请按指定风格优化以下剧本的对白和动作描写。

## 润色风格: {style}
风格参考: faithful=忠实原著保留原意, tv_drama=影视剧口语化增强画面感, short_drama=短剧快节奏精简对白, anime=动漫热血中二夸张, movie=电影凝练富有张力, tv_series=电视剧娓娓道来, stage=舞台剧戏剧化

## 润色要求
1. 对白必须逐句改写，使用更符合风格的表达方式
2. action和emotion字段要重新编写，不能照搬原文
3. stageDirections 要根据风格调整
4. 场景描述 description 可以润色
5. 保留原始 YAML 字段结构，只改内容
6. 输出完整的润色后 YAML，不要省略任何内容

## 原始剧本
{yaml}`
