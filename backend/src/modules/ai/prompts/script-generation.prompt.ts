// Prompt 模板 — Script Generation (YAML)
export const SCRIPT_GENERATION_PROMPT = `你是一位专业编剧。请根据场景规划和人物信息，生成完整 YAML 格式剧本。

## 格式要求
\`\`\`yaml
title: 剧本标题
metadata:
  author: 原作者
  adaptedBy: AI
  genre: 类型
  totalScenes: N
scenes:
  - sceneNumber: 1
    location: 地点
    time: 时间
    participants: [角色]
    description: 环境描述
    dialogues:
      - speaker: 角色
        text: 对白
        action: 动作(可选)
        emotion: 情感(可选)
    stageDirections: [指示]
\`\`\`

## 要求
对白符合作格，保留核心冲突和情感张力，每场景不少于3段对白。

## 场景规划
{scenes}

## 人物
{characters}`
