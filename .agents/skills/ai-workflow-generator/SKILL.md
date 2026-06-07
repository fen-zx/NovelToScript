---
name: ai-workflow-generator
description: "根据业务需求生成AI工作流设计，包括任务拆解、Prompt设计、LangChain链路、模型调用策略、上下文管理、结果校验、重试机制和成本优化策略。"
argument-hint: "[PRD.md / BUSINESS_LOGIC.md / QUEUE_SPECS.md]"
user-invocable: true
---

# AI Workflow Generator

## 目标

生成完整AI工作流设计。

输出：

```text
AI_WORKFLOW.md
```

用于：

- LangChain实现
- DeepSeek调用
- Prompt管理
- AI Service设计
- BackendCodeGenerator

---

# 适用场景

适用于：

```text
文本生成

内容分析

角色提取

知识抽取

剧本生成

摘要生成
```

---

# 输入

支持：

## PRD

```text
小说自动转剧本
```

---

## 业务逻辑

```text
上传小说

生成角色

生成剧本

导出YAML
```

---

## 队列设计

```text
generate-script

analyze-character
```

---

# 输出结构

必须包含：

```text
工作流总览

任务拆解

Prompt设计

上下文设计

模型调用策略

输出格式

校验机制

重试机制

成本优化

风险分析
```

---

# 第一部分：工作流总览

输出：

```text
上传小说

↓

文本切块

↓

摘要生成

↓

角色提取

↓

剧情分析

↓

场景生成

↓

对白生成

↓

YAML生成

↓

YAML校验

↓

存储
```

---

# 第二部分：任务拆解

自动识别子任务。

输出：

```markdown
Task-01

Novel Chunking

---

Task-02

Character Extraction

---

Task-03

Plot Analysis

---

Task-04

Scene Generation

---

Task-05

Dialogue Generation

---

Task-06

YAML Validation
```

---

# 第三部分：文本切块策略

输出：

```markdown
Chunk Size

3000 Tokens
```

---

```markdown
Chunk Overlap

300 Tokens
```

---

策略：

```text
章节优先

段落优先

避免切断对话
```

---

# 第四部分：Prompt设计

每个任务生成Prompt模板。

输出：

```markdown
# Character Extraction Prompt

目标：

提取角色

输出JSON

字段：

name

description

relationship
```

---

```markdown
# Scene Generation Prompt

目标：

生成场景

输出YAML
```

---

要求：

Prompt必须：

```text
角色明确

输出格式明确

禁止自由发挥
```

---

# 第五部分：上下文设计

输出：

```markdown
Context

Novel Summary

Characters

Previous Scenes
```

---

上下文来源：

```text
Redis

Database

Memory
```

---

限制：

```text
避免上下文无限增长
```

---

推荐：

```text
摘要压缩
```

---

# 第六部分：模型调用策略

输出：

```markdown
Model

DeepSeek Chat
```

---

调用场景：

```text
摘要

角色分析

剧本生成
```

---

输出：

```markdown
Temperature

0.7
```

---

```markdown
Max Tokens

4000
```

---

# 第七部分：LangChain设计

生成：

```text
PromptTemplate

RunnableSequence

OutputParser
```

---

输出：

```text
NovelAnalyzerChain

CharacterChain

SceneChain

YamlChain
```

---

示例：

```text
Novel

↓

SummaryChain

↓

CharacterChain

↓

SceneChain

↓

YamlChain
```

---

# 第八部分：输出格式

统一：

```json
{
  "characters":[]
}
```

---

或者：

```yaml
title:

scenes:
```

---

禁止：

```text
自然语言自由输出
```

---

必须：

```text
结构化输出
```

---

# 第九部分：结果校验

生成：

```markdown
Validation

JSON Schema

YAML Schema
```

---

检查：

```text
缺失字段

格式错误

空结果
```

---

失败：

```text
重新生成
```

---

# 第十部分：重试机制

输出：

```markdown
Retry

最多：

3次
```

---

触发：

```text
超时

格式错误

空输出
```

---

策略：

```text
指数退避
```

---

# 第十一部分：缓存设计

输出：

```markdown
Cache

Novel Summary

Characters

Plot Analysis
```

---

Redis Key：

```text
summary:{novelId}

characters:{novelId}
```

---

避免重复调用AI。

---

# 第十二部分：成本优化

检查：

```text
Token消耗

重复调用

上下文过长
```

---

输出：

```markdown
建议：

先摘要

再生成
```

---

```markdown
建议：

角色分析缓存
```

---

# 第十三部分：AI剧本工具特殊规则

发现：

```text
Novel

Scene

Character
```

时。

必须生成：

```markdown
NovelAnalyzerChain

CharacterExtractionChain

PlotAnalysisChain

SceneGenerationChain

DialogueGenerationChain

YamlGenerationChain

YamlValidationChain
```

---

推荐流程：

```text
Novel

↓

NovelAnalyzerChain

↓

CharacterExtractionChain

↓

PlotAnalysisChain

↓

SceneGenerationChain

↓

DialogueGenerationChain

↓

YamlGenerationChain

↓

YamlValidationChain
```

---

# 第十四部分：错误处理

输出：

```markdown
AI_TIMEOUT

AI_EMPTY_RESPONSE

AI_INVALID_JSON

AI_INVALID_YAML
```

---

处理：

```text
记录日志

重试

回滚任务状态
```

---

# 第十五部分：监控设计

输出：

```markdown
监控

调用次数

Token消耗

平均耗时

成功率
```

---

建议：

```text
Prometheus

Grafana
```

---

# 第十六部分：风险分析

输出：

```markdown
RISK-001

上下文过长

等级：

High

建议：

摘要压缩
```

---

```markdown
RISK-002

输出格式不稳定

等级：

High

建议：

Schema校验
```

---

```markdown
RISK-003

成本过高

等级：

Medium

建议：

缓存分析结果
```

---

# LangChain规范

必须：

```text
PromptTemplate

OutputParser

RunnableSequence
```

---

禁止：

```text
所有逻辑堆在一个Prompt里
```

---

必须：

```text
多阶段工作流
```

---

# 工作步骤

Step1

识别AI任务

Step2

拆分子任务

Step3

设计Prompt

Step4

设计上下文

Step5

设计Chain

Step6

设计输出格式

Step7

设计校验

Step8

设计重试

Step9

设计缓存

Step10

设计监控

Step11

输出风险分析

---

# 强制要求

必须输出：

- 工作流图
- Prompt设计
- Chain设计
- 上下文设计
- 输出格式
- 校验机制
- 重试机制
- 成本优化
- 风险分析

禁止：

- 单Prompt完成全部任务
- 非结构化输出
- 无校验直接入库

未知内容统一标记：

[待确认]