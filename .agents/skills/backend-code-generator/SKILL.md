---
name: backend-code-generator
description: "根据后端架构文档生成 Express + Prisma + BullMQ + Redis + MinIO + LangChain 项目代码，包括 Controller、Service、Repository、DTO、Queue、Worker、AI Workflow、Middleware、Config 和项目目录结构。"
argument-hint: "[ARCHITECTURE.md / API_SPECS.md / SERVICE_SPECS.md / REPOSITORY_SPECS.md / QUEUE_SPECS.md / AI_WORKFLOW.md]"
user-invocable: true
---

# Backend Code Generator

## 目标

根据设计文档生成可运行的后端代码。

输出：

```text
backend/src/*
```

完整目录结构。

---

# 默认技术栈

```yaml
Runtime: Node.js

Framework: Express

Language: TypeScript

ORM: Prisma

Database: SQLite

Queue: BullMQ

Cache: Redis

Storage: MinIO

AI: LangChain + DeepSeek

Validation: Zod

Logging: Pino
```

---

# 输入

支持：

## ARCHITECTURE.md

## DATABASE_SCHEMA.md

## API_SPECS.md

## SERVICE_SPECS.md

## REPOSITORY_SPECS.md

## QUEUE_SPECS.md

## AI_WORKFLOW.md

---

# 输出结构

必须生成：

```text
项目目录

Controllers

Services

Repositories

DTO

Routes

Middlewares

Queues

Workers

LangChain

Config

Utils

Types
```

---

# 第一部分：项目目录

生成：

```text
src/

modules/

auth/

user/

novel/

script/

task/

export/

ai/

shared/

config/

database/

cache/

queue/

storage/

middlewares/

types/

utils/
```

---

# 第二部分：Controller生成

根据 API_SPECS 生成。

示例：

```ts
export class ScriptController {

  async create(req,res){}

  async getById(req,res){}

  async generate(req,res){}

}
```

---

职责：

```text
接收请求

参数验证

调用Service

返回响应
```

---

禁止：

```text
业务逻辑
Prisma操作
AI调用
```

---

# 第三部分：Route生成

输出：

```ts
router.post(
  "/scripts",
  controller.create
)

router.post(
  "/scripts/generate",
  controller.generate
)
```

---

结构：

```text
script.routes.ts

novel.routes.ts

task.routes.ts
```

---

# 第四部分：DTO生成

根据 API_SPECS 自动生成。

示例：

```ts
export const CreateScriptSchema =
z.object({

  novelId:z.string(),

  title:z.string()

})
```

---

同时生成：

```ts
export type CreateScriptDto =
z.infer<typeof CreateScriptSchema>
```

---

统一：

```text
Zod
```

---

# 第五部分：Service生成

根据 SERVICE_SPECS。

示例：

```ts
export class ScriptService {

  constructor(
    private repository:ScriptRepository
  ){}

}
```

---

职责：

```text
业务逻辑

事务

权限

缓存

队列
```

---

禁止：

```text
HTTP处理
```

---

# 第六部分：Repository生成

根据 REPOSITORY_SPECS。

示例：

```ts
export class ScriptRepository {

  async findById(id:string){

    return prisma.script.findUnique({
      where:{id}
    })

  }

}
```

---

统一：

```text
Prisma
```

---

禁止：

```text
业务逻辑
```

---

# 第七部分：Prisma Client

生成：

```ts
import { PrismaClient }

from "@prisma/client"

export const prisma =
new PrismaClient()
```

---

路径：

```text
shared/database/prisma.ts
```

---

# 第八部分：Queue生成

根据 QUEUE_SPECS。

生成：

```ts
export const generateScriptQueue =
new Queue(
  "generate-script"
)
```

---

路径：

```text
queue/queues/
```

---

# 第九部分：Worker生成

生成：

```ts
new Worker(
  "generate-script",
  async(job)=>{

  }
)
```

---

职责：

```text
AI调用

生成剧本

更新状态
```

---

路径：

```text
queue/workers/
```

---

# 第十部分：AI Service生成

根据 AI_WORKFLOW。

生成：

```ts
export class AIService {

  async analyzeNovel(){}

  async extractCharacters(){}

  async generateScenes(){}

  async validateYaml(){}

}
```

---

路径：

```text
modules/ai/
```

---

# 第十一部分：LangChain生成

生成：

```ts
PromptTemplate

RunnableSequence

OutputParser
```

---

Chain：

```ts
NovelAnalyzerChain

CharacterChain

SceneChain

YamlChain
```

---

禁止：

```text
一个超长Prompt
```

---

# 第十二部分：Redis生成

生成：

```ts
ioredis
```

配置。

---

路径：

```text
shared/cache/
```

---

示例：

```ts
export const redis =
new Redis()
```

---

# 第十三部分：MinIO生成

生成：

```ts
export const minioClient
```

配置。

---

路径：

```text
shared/storage/
```

---

支持：

```text
txt

pdf

yaml
```

---

# 第十四部分：Middleware生成

必须生成：

```text
AuthMiddleware

ErrorMiddleware

ValidationMiddleware

LoggerMiddleware
```

---

错误处理中间件：

```ts
next(error)
```

统一响应。

---

# 第十五部分：Error设计

生成：

```ts
class AppError extends Error
```

---

标准：

```ts
SCRIPT_NOT_FOUND

TASK_NOT_FOUND

AI_TIMEOUT
```

---

禁止：

```ts
throw "error"
```

---

# 第十六部分：日志系统

统一：

```text
Pino
```

---

生成：

```ts
logger.info()

logger.error()
```

---

禁止：

```ts
console.log
```

---

# 第十七部分：环境变量

生成：

```env
PORT=3000

DATABASE_URL=file:./dev.db

REDIS_URL=redis://localhost:6379

MINIO_ENDPOINT=localhost

MINIO_PORT=9000

DEEPSEEK_API_KEY=
```

---

同时生成：

```ts
config/env.ts
```

---

# 第十八部分：依赖注入

推荐：

```ts
constructor(
  repo:ScriptRepository
)
```

---

禁止：

```ts
new Repository()
```

在业务代码中到处创建。

---

# 第十九部分：AI剧本项目特殊规则

发现：

```text
Novel

Script

Scene

Character
```

实体时。

必须生成：

```text
NovelController

ScriptController

TaskController

AIController
```

---

Service：

```text
NovelService

ScriptService

TaskService

AIService
```

---

Worker：

```text
GenerateScriptWorker

ExportPdfWorker
```

---

Chain：

```text
NovelAnalyzerChain

CharacterExtractionChain

SceneGenerationChain

YamlGenerationChain
```

---

# 第二十部分：测试代码

生成：

```text
unit tests

integration tests
```

---

示例：

```ts
describe(
 "ScriptService"
)
```

---

# 第二十一部分：输出文件清单

必须输出：

```text
src/modules

src/shared

src/config

src/queue

src/types

src/utils
```

以及每个文件内容。

---

# 工作步骤

Step1

读取架构文档

Step2

生成目录

Step3

生成DTO

Step4

生成Repository

Step5

生成Service

Step6

生成Controller

Step7

生成Routes

Step8

生成Queue

Step9

生成Worker

Step10

生成AI Workflow

Step11

生成Middleware

Step12

生成Config

Step13

生成测试代码

---

# 强制要求

必须：

- TypeScript
- Express
- Prisma
- BullMQ
- Redis
- MinIO
- LangChain

必须生成：

- Controller
- Service
- Repository
- DTO
- Queue
- Worker
- Middleware
- Config

禁止：

- Controller写业务逻辑
- Service直接操作HTTP
- Repository写业务逻辑
- AI逻辑写在Controller

未知内容统一标记：

[TODO]