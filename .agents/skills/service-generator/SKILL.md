---
name: service-generator
description: "根据 API 设计、数据库模型和业务规则生成 Service 层设计文档，包括业务职责、方法定义、事务设计、权限校验、状态流转、缓存策略、队列调用和异常处理规范。"
argument-hint: "[API_SPECS.md / DATABASE_SCHEMA.md / BUSINESS_LOGIC.md]"
user-invocable: true
---

# Service Generator

## 目标

生成 Service 层设计文档。

用于：

- Controller 设计
- Repository 设计
- BackendCodeGenerator
- 业务逻辑审查

输出：

```text
SERVICE_SPECS.md
```

---

# Service职责

Service层负责：

```text
业务逻辑

权限校验

事务控制

状态流转

缓存管理

队列调度

AI调用协调
```

---

禁止：

```text
直接操作HTTP

直接返回Response

直接访问Request
```

这些属于Controller职责。

---

# 输入

支持：

## API_SPECS

```yaml
POST /scripts/generate

GET /scripts/:id

PUT /scripts/:id
```

---

## DATABASE_SCHEMA

```text
User

Novel

Script

Version

Scene

Task
```

---

## BUSINESS_LOGIC

```text
用户上传小说

生成剧本

创建任务

异步执行
```

---

# 输出结构

必须包含：

```text
Service列表

业务职责

方法定义

输入参数

返回值

权限要求

事务设计

缓存设计

队列设计

异常处理

风险分析
```

---

# 第一部分：Service识别

根据实体自动生成。

示例：

```markdown
# Services

UserService

NovelService

ScriptService

TaskService

ExportService

AIService
```

---

# 第二部分：职责定义

输出：

```markdown
# ScriptService

职责：

剧本管理

剧本生成

版本管理

导出协调
```

---

# 第三部分：方法设计

输出：

```markdown
# ScriptService

## createScript

作用：

创建剧本

输入：

CreateScriptDto

返回：

Script
```

---

示例：

```markdown
## getScriptById

输入：

scriptId

返回：

ScriptDetail
```

---

# 第四部分：参数定义

输出：

```ts
interface CreateScriptDto {

  novelId:string

  title:string

}
```

---

要求：

参数必须来源于：

```text
API DTO

数据库模型
```

禁止凭空创造字段。

---

# 第五部分：返回模型

输出：

```ts
interface ScriptDetail {

  id:string

  title:string

  status:string

}
```

---

要求：

统一返回DTO。

禁止直接暴露数据库模型。

---

# 第六部分：事务设计

识别：

```text
创建

删除

状态变更

批量操作
```

---

输出：

```markdown
# Transaction

createScript

需要事务

原因：

同时创建：

Script

Version
```

---

生成建议：

```ts
prisma.$transaction()
```

---

# 第七部分：权限设计

自动识别：

```text
Admin

Author

Viewer
```

---

输出：

```markdown
# Permission

createScript

需要：

script:create
```

---

```markdown
deleteScript

需要：

script:delete
```

---

# 第八部分：状态流转

自动识别状态字段。

输出：

```text
DRAFT

↓

GENERATING

↓

COMPLETED
```

---

示例：

```markdown
# Script Status

DRAFT

GENERATING

COMPLETED

FAILED

ARCHIVED
```

---

同时输出：

```markdown
禁止：

COMPLETED -> DRAFT
```

---

# 第九部分：缓存策略

识别：

```text
列表查询

详情查询

统计数据
```

---

输出：

```markdown
# Cache

scripts:list

TTL

300秒
```

---

```markdown
script:detail:{id}

TTL

600秒
```

---

缓存工具：

```text
Redis
```

---

# 第十部分：队列设计

识别耗时任务。

输出：

```markdown
# Queue

generate-script
```

---

Job：

```ts
GenerateScriptJob {

  scriptId:string

  novelId:string

}
```

---

Worker：

```text
GenerateScriptWorker
```

---

要求：

生成：

```text
BullMQ
```

设计建议。

---

# 第十一部分：AI调用设计

如果检测到：

```text
AI

LLM

Prompt

生成
```

---

输出：

```markdown
# AI Flow

上传小说

↓

切块

↓

角色分析

↓

剧本生成

↓

YAML校验

↓

保存结果
```

---

生成：

```text
AIService
```

职责：

```text
Prompt管理

模型调用

重试

结果解析
```

---

# 第十二部分：异常处理

输出：

```markdown
# Exceptions

SCRIPT_NOT_FOUND

权限不足

任务不存在

AI生成失败
```

---

统一格式：

```ts
throw new AppError(
  "SCRIPT_NOT_FOUND"
)
```

---

禁止：

```ts
throw "error"
```

---

# 第十三部分：Repository依赖

输出：

```markdown
# Dependencies

ScriptService

依赖：

ScriptRepository

VersionRepository
```

---

```markdown
NovelService

依赖：

NovelRepository
```

---

禁止：

```text
Service直接写Prisma
```

---

# 第十四部分：Controller映射

自动生成：

```markdown
POST /scripts

↓

ScriptController.create

↓

ScriptService.createScript
```

---

```markdown
POST /scripts/generate

↓

ScriptController.generate

↓

ScriptService.generateScript
```

---

# 第十五部分：性能分析

检查：

```text
重复查询

事务过大

缓存缺失

队列缺失
```

---

输出：

```markdown
# Performance

发现：

Script列表频繁查询

建议：

Redis缓存
```

---

# 第十六部分：风险分析

输出：

```markdown
RISK-001

AI生成超时

等级：

High

建议：

BullMQ异步执行
```

---

```markdown
RISK-002

剧本生成失败

等级：

Medium

建议：

增加重试机制
```

---

# AI剧本工具特殊规则

如果发现：

```text
Novel

Script

Version

Scene

Character
```

实体。

必须生成：

```markdown
NovelService

ScriptService

VersionService

CharacterService

TaskService

AIService

ExportService
```

---

ScriptService必须包含：

```text
createScript

updateScript

deleteScript

generateScript

saveVersion

publishVersion
```

---

AIService必须包含：

```text
analyzeNovel

extractCharacters

generateScenes

generateDialogue

validateYaml
```

---

# 工作步骤

Step1

读取API设计

Step2

读取数据库模型

Step3

识别业务实体

Step4

生成Service列表

Step5

生成方法定义

Step6

生成事务设计

Step7

生成权限设计

Step8

生成缓存设计

Step9

生成队列设计

Step10

生成异常设计

Step11

生成风险分析

---

# 强制要求

必须输出：

- Service列表
- 方法设计
- DTO定义
- 事务设计
- 权限设计
- 状态流转
- 缓存设计
- 队列设计
- Repository依赖
- 风险分析

禁止：

- 直接生成Controller代码
- 直接生成Prisma代码
- Service直接操作HTTP
- Service直接返回Express Response

未知内容统一标记：

[待确认]