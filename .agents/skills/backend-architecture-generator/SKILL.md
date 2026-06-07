---
name: backend-architecture-generator
description: "根据需求模型、设计文档和业务规则生成完整后端架构方案，包括模块划分、领域模型、目录结构、数据库设计、缓存设计、队列设计、存储设计、AI工作流、安全策略和扩展方案。"
argument-hint: "[RequirementAnalyzer输出 / DesignGenerator输出 / PRD / JSON]"
user-invocable: true
---

# Backend Architecture Generator

## 目标

根据需求分析结果自动生成后端架构设计方案。

输出结果用于：

- API设计
- 数据库设计
- Service设计
- Repository设计
- 队列设计
- AI流程设计
- 权限设计

最终形成统一的后端架构蓝图。

---

# 适用场景

适用于：

- Express项目
- NestJS项目
- Fastify项目
- LangChain项目
- AI Agent项目
- SaaS项目
- 管理后台项目

尤其适用于：

- React + Express
- Prisma + SQLite
- BullMQ + Redis
- MinIO
- LangChain

技术栈。

---

# 输入格式

支持以下输入：

## 方式1

RequirementAnalyzer 输出

```markdown
# 实体模型

User
Script
Chapter
Scene
```

## 方式2

DesignGenerator 输出

```markdown
# 页面

剧本编辑器

剧本管理
```

## 方式3

PRD

```markdown
用户上传小说后生成剧本
```

## 方式4

JSON

```json
{
  "entities": [
    "User",
    "Script"
  ]
}
```

---

# 输出格式

默认：

Markdown

用户明确要求：

JSON

则输出结构化JSON。

---

# 输出结构

必须包含：

```text
系统概览

架构风格

业务模块

领域模型

分层架构

目录结构

数据库设计

缓存设计

队列设计

文件存储设计

AI工作流

权限架构

安全设计

扩展性设计

部署建议

技术选型

架构风险
```

---

# 第一部分：系统概览

输出：

```markdown
# Backend Overview

系统名称：

AI剧本创作平台

系统职责：

- 用户管理
- 小说管理
- AI剧本生成
- 剧本编辑
- PDF导出
- 文件管理
```

---

# 第二部分：架构风格

根据项目规模推荐架构。

## 小中型项目

推荐：

```text
Modular Monolith
```

## 中大型项目

推荐：

```text
Clean Architecture
```

## 多团队协作

推荐：

```text
Microservice
```

输出：

```markdown
# Architecture Style

推荐：

Modular Monolith

原因：

开发效率高
部署简单
维护成本低
适合当前项目规模
```

---

# 第三部分：业务模块

识别所有业务模块。

输出：

```markdown
# Modules

Auth

User

Novel

Script

Character

Scene

Version

Task

Export

Storage

AI
```

---

# 第四部分：领域模型

构建领域模型。

输出：

```markdown
# Domain Model

User
 └── Script
      └── Version
            └── Scene

Novel
 └── Script

Script
 └── Character
```

同时生成：

```text
User 1:N Script

Script 1:N Version

Version 1:N Scene

Script N:N Character
```

---

# 第五部分：聚合边界

识别聚合根。

输出：

```markdown
# Aggregate Roots

User

Script

Novel
```

例如：

```text
Script

Version

Scene
```

属于同一个聚合。

---

# 第六部分：分层架构

每个模块必须生成：

```text
Controller

Service

Repository

DTO

Validator
```

输出：

```markdown
# Layered Architecture

Script

- ScriptController
- ScriptService
- ScriptRepository
- ScriptDto
- ScriptValidator

User

- UserController
- UserService
- UserRepository
```

---

# 第七部分：目录结构

生成推荐目录。

输出：

```text
src/

modules/

auth/
user/
novel/
script/
scene/
version/
export/
task/
ai/

shared/

database/
cache/
queue/
storage/

middleware/

config/

utils/
```

---

# 模块结构

输出：

```text
script/

script.controller.ts

script.service.ts

script.repository.ts

script.dto.ts

script.validator.ts

script.routes.ts
```

---

# 第八部分：数据库设计

生成数据库规划。

输出：

```markdown
# Database

数据库：

SQLite

ORM：

Prisma

主要表：

users

novels

scripts

versions

scenes

characters

tasks
```

---

# 数据关系

输出：

```markdown
# Relationships

users

1:N

scripts

scripts

1:N

versions

versions

1:N

scenes
```

---

# 索引建议

输出：

```markdown
# Indexes

scripts

- user_id
- status
- created_at

tasks

- status
- created_at
```

---

# 唯一约束

输出：

```markdown
# Unique Constraints

users.email

scripts.uuid
```

---

# 第九部分：缓存设计

识别缓存场景。

输出：

```markdown
# Cache

Redis
```

---

# 缓存项

输出：

```markdown
script_detail

script_list

user_profile

task_status
```

---

# TTL建议

输出：

```markdown
script_detail

300s

user_profile

600s

task_status

60s
```

---

# 缓存失效策略

输出：

```markdown
更新剧本

↓

删除缓存

↓

重新加载
```

---

# 第十部分：队列设计

识别耗时任务。

输出：

```markdown
# Queues

generate-script

export-pdf

embedding

cleanup
```

---

# Job定义

输出：

```markdown
GenerateScriptJob

Payload

- userId
- novelId

Result

- scriptId
```

---

# 重试策略

输出：

```markdown
Attempts

3

Backoff

Exponential
```

---

# 死信队列

输出：

```markdown
generate-script-dlq
```

---

# 第十一部分：文件存储设计

输出：

```markdown
# Storage

MinIO
```

---

# Bucket设计

输出：

```markdown
novels

scripts

exports

temp
```

---

# 生命周期

输出：

```markdown
temp

7天自动删除

exports

90天自动删除
```

---

# 第十二部分：AI工作流

识别AI能力。

输出：

```markdown
# AI Workflow

上传小说

↓

解析文本

↓

切块

↓

摘要

↓

生成剧本

↓

YAML校验

↓

保存数据库
```

---

# AI模块

输出：

```markdown
NovelParser

ChunkService

SummaryGenerator

ScriptGenerator

YamlValidator

CharacterAnalyzer
```

---

# Prompt层设计

输出：

```markdown
Prompts

NovelSummaryPrompt

ScreenplayPrompt

CharacterPrompt
```

---

# 第十三部分：权限架构

生成权限模型。

输出：

```markdown
# RBAC

Admin

Author

Viewer
```

---

# 权限矩阵

输出：

```markdown
Author

Create Script

Update Own Script

Delete Own Script

Admin

Manage All Scripts
```

---

# 第十四部分：安全设计

输出：

```markdown
# Security

JWT

RBAC

Rate Limit

Input Validation
```

---

# 上传安全

检查：

```markdown
允许：

txt
docx
pdf

禁止：

exe
js
bat
```

---

# AI安全

检查：

```markdown
Prompt Injection

Output Validation

Token Limit
```

---

# 第十五部分：扩展性设计

输出：

```markdown
# Scalability

Repository抽象

Storage抽象

LLM抽象

Queue抽象
```

---

# Provider接口

输出：

```typescript
interface LLMProvider {

generate()

chat()

embedding()

}
```

---

# 第十六部分：部署建议

输出：

```markdown
# Deployment

Frontend

Vercel

Backend

Docker

Database

SQLite

Storage

MinIO

Cache

Redis
```

---

# 容器规划

输出：

```text
frontend

backend

redis

minio
```

---

# 第十七部分：技术选型

根据项目生成。

输出：

```markdown
# Tech Stack

Runtime

Node.js

Framework

Express

ORM

Prisma

Database

SQLite

Cache

Redis

Queue

BullMQ

Storage

MinIO

AI

LangChain

LLM

DeepSeek
```

---

# 第十八部分：架构风险分析

自动发现：

- 模块耦合
- 单点故障
- 性能瓶颈
- 数据一致性问题
- 队列缺失
- 缓存缺失

输出：

```markdown
# Risks

RISK-001

剧本生成同步执行

等级：

High

建议：

BullMQ异步化

---

RISK-002

缺少任务状态查询

等级：

Medium

建议：

增加Task模块

---

RISK-003

缓存缺失

等级：

Low

建议：

增加Redis缓存
```

---

# 工作步骤

Step1

读取需求模型

Step2

识别业务模块

Step3

构建领域模型

Step4

生成聚合边界

Step5

生成分层架构

Step6

生成数据库设计

Step7

生成缓存设计

Step8

生成队列设计

Step9

生成存储设计

Step10

生成AI工作流

Step11

生成权限设计

Step12

生成安全设计

Step13

生成扩展方案

Step14

输出风险分析

---

# 强制要求

必须输出：

- 模块划分
- 领域模型
- 分层架构
- 数据库设计
- 缓存设计
- 队列设计
- 存储设计
- AI工作流
- 权限设计
- 安全设计
- 风险分析

禁止：

- 直接生成业务代码
- 跳过章节
- 凭空捏造实体

未知内容统一标记：

[待确认]

风险等级统一使用：

High
Medium
Low