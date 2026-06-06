// Prompt 模板 — Script Generation (YAML)
export const SCRIPT_GENERATION_PROMPT = `你是一位专业编剧。请根据场景规划和人物信息，生成完整 YAML 格式剧本。

## ⚠️ 重要约束
1. 严格仅基于下面提供的场景规划、人物信息和原文参考生成剧本。每个对白、动作、情节必须能在原文参考或场景规划中找到明确依据
2. **禁止使用你对知名作品的先验知识**：不要尝试识别这是哪部小说，不要填写你在训练数据中学到的作者名或书名。title 必须从原文内容中提取（如无明确标题则用主角名+核心事件命名），author 在原文未明确提及时必须填"未知"
3. 不得凭空编造对话内容、情节转折或角色互动

## 格式要求
\`\`\`yaml
title: 剧本标题（从原文提炼，禁止使用已知作品名）
metadata:
  author: 原作者（原文未提则填"未知"）
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
对白符合作格，保留核心冲突和情感张力，每场景不少于3段对白。对白应尽可能从原文参考中提取原文对话。

## 场景规划
{scenes}

## 人物
{characters}

## 原文参考(对应场景的原文片段)
{sourceText}`
