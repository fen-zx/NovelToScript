# SERVICE_SPECS — Service 层设计

> 基于 API_SPECS (16接口) + DATABASE_SCHEMA (9表) 生成
> 日期: 2026-06-07 | 架构: Modular Monolith

---

## 一、Service 清单

| Service              | 职责                                                  | 对应模块 |
| -------------------- | ----------------------------------------------------- | -------- |
| **UserService**      | 用户注册、登录、密码重置、账号检查、配额              | Auth     |
| **NovelService**     | 小说导入、章节识别、文本分片、文件存储                | Novel    |
| **TaskService**      | 任务创建、列表、详情、状态流转、SSE、删除             | Task     |
| **ScriptService**    | 剧本 CRUD、版本管理、回滚（聚合根）                   | Script   |
| **VersionService**   | 版本快照创建、查询、回滚                              | Script   |
| **CharacterService** | 剧本角色管理                                          | Script   |
| **AIService**        | 7 Agent 流水线编排 (含忠实度校验)、LLM 调用、结果解析 | AI       |
| **PolishService**    | 剧本润色（7 种风格）                                  | Polish   |
| **ExportService**    | 多格式导出（yaml/json/md/txt/pdf）                    | Export   |
| **SchemaService**    | YAML Schema 文档                                      | Schema   |
| **StorageService**   | MinIO 上传/下载/生命周期                              | Storage  |

---

## 二、UserService

**职责**: 用户认证与配额管理

### 方法定义

#### register

| 属性 | 内容                                                    |
| ---- | ------------------------------------------------------- |
| 输入 | `RegisterDto { username, account, password }`           |
| 校验 | account 唯一性、username 2-20 字符、password ≥6 位      |
| 返回 | `RegisterResponse { id, username, account, createdAt }` |
| 事务 | ✅ — 单表写入，无事务需求                               |
| 缓存 | —                                                       |

#### login

| 属性 | 内容                             |
| ---- | -------------------------------- |
| 输入 | `LoginDto { account, password }` |
| 校验 | bcrypt 比对 passwordHash         |
| 返回 | `LoginResponse { token, user }`  |
| 事务 | —                                |
| 缓存 | —                                |

#### resetPassword

| 属性 | 内容                                         |
| ---- | -------------------------------------------- |
| 输入 | `ResetPasswordDto { username, newPassword }` |
| 校验 | username 存在性，newPassword ≥6 位           |
| 返回 | `null`                                       |
| 事务 | ✅ `prisma.$transaction` — 更新 passwordHash |
| 缓存 | —                                            |

#### checkAccount

| 属性 | 内容                                            |
| ---- | ----------------------------------------------- |
| 输入 | `CheckAccountQuery { check: "account", value }` |
| 返回 | `AccountCheckResponse { available: boolean }`   |
| 事务 | —                                               |
| 缓存 | —（实时查询）                                   |

#### getStorageQuota

| 属性 | 内容                                              |
| ---- | ------------------------------------------------- |
| 输入 | `userId: string`                                  |
| 返回 | `{ storageUsed: number, max: 524288000 }` (500MB) |
| 缓存 | `user:{id}:quota`, TTL 600s, 上传/删除后失效      |

### 权限

| 方法              | 权限     |
| ----------------- | -------- |
| `register`        | 无需认证 |
| `login`           | 无需认证 |
| `resetPassword`   | 无需认证 |
| `checkAccount`    | 无需认证 |
| `getStorageQuota` | 仅自己   |

### 异常

| 场景         | 错误码                       |
| ------------ | ---------------------------- |
| 账号已存在   | `ACCOUNT_EXISTS (2001)`      |
| 用户名不存在 | `USERNAME_NOT_FOUND (2002)`  |
| 密码错误     | `INVALID_CREDENTIALS (2003)` |
| 存储配额超限 | `QUOTA_EXCEEDED` [待确认]    |

### Repository 依赖

- `UserRepository`

---

## 三、NovelService

**职责**: 小说导入、章节识别、MinIO 存储协调

### 方法定义

#### importNovel

| 属性 | 内容                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入 | `ImportNovelBody { title, author? }` + `File (multer)`                                                                                            |
| 校验 | 文件 MIME + 魔数白名单，≤20MB                                                                                                                     |
| 流程 | 1. `StorageService.upload(bucket:"novels", file)` → `filePath` 2. `ChapterDetector.detect(rawText)` → chapters 3. `NovelRepository.create({...})` |
| 返回 | `NovelResponse { id, title, author, chapterCount, wordCount, fileFormat, createdAt }`                                                             |
| 事务 | ✅ — 上传失败需清理 MinIO 文件                                                                                                                    |
| 缓存 | 成功后失效 `user:{id}:quota`                                                                                                                      |

### 权限

| 方法          | 权限   |
| ------------- | ------ |
| `importNovel` | Author |

### 状态流转

无（Novel 无状态字段）

### 异常

| 场景                  | 错误码                           |
| --------------------- | -------------------------------- |
| 文件超过 20MB         | `FILE_TOO_LARGE (5001)`          |
| 格式不支持            | `FILE_FORMAT_UNSUPPORTED (5002)` |
| 章节数不在 3~100 之间 | `VALIDATION_ERROR (9002)`        |

### Repository 依赖

- `NovelRepository`

### 外部依赖

- `StorageService` (MinIO)
- `ChapterDetector` (章节识别工具)

---

## 四、TaskService

**职责**: 任务生命周期管理、状态流转、SSE 实时推送

### 状态流转

```
QUEUED ──→ PROCESSING ──→ COMPLETED
  │                         │
  └────→ FAILED ←───────────┘ (可重试)

禁止: COMPLETED → PROCESSING
禁止: COMPLETED → FAILED (除非手动重试)
重试: FAILED → QUEUED (断点 resumeFromAgent / 从头 restart)
```

### 方法定义

#### createTask

| 属性 | 内容                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| 输入 | `CreateTaskDto { novelId }`                                                                                             |
| 校验 | novelId 存在、无重复任务（1:1）、队列上限（运行1+排队3）                                                                |
| 流程 | 1. 检查 Novel 归属 2. 检查队列容量 3. `TaskRepository.create(status:QUEUED)` 4. `AIService.enqueueGenerateScript(task)` |
| 返回 | `TaskCreatedResponse { id, status, progress }`                                                                          |
| 事务 | ✅ — 创建 Task + 7条 AgentResult（PENDING）                                                                             |
| 队列 | `script-generation` Queue（BullMQ）                                                                                     |

#### getTaskList

| 属性 | 内容                                                           |
| ---- | -------------------------------------------------------------- |
| 输入 | `TaskListQuery { page, pageSize, status?, sortBy, sortOrder }` |
| 返回 | `PaginatedData<TaskSummaryResponse>`                           |
| 缓存 | —（实时数据，不缓存）                                          |
| 权限 | 只返回当前用户的 Task (userId 过滤)                            |

#### getTaskById

| 属性 | 内容                                     |
| ---- | ---------------------------------------- |
| 输入 | `taskId: string`                         |
| 返回 | `TaskDetailResponse` (含 agentResults[]) |
| 缓存 | `task:{id}`, TTL 60s, 状态变更时失效     |

#### streamTaskProgress (SSE)

| 属性 | 内容                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| 输入 | `taskId: string`                                                                               |
| 输出 | SSE 事件流: `agent-start` / `agent-progress` / `agent-done` / `agent-failed` / `task-complete` |
| 实现 | Redis Pub/Sub 频道 `task:{id}:events`                                                          |

#### retryTask

| 属性 | 内容                                                                  |
| ---- | --------------------------------------------------------------------- | ------------ |
| 输入 | `taskId: string`, `RetryTaskDto { mode: "resume"                      | "restart" }` |
| 校验 | Task.status === FAILED                                                |
| 流程 | resume: 从 `resumeFromAgent` 开始; restart: 清空 AgentResult 重新入队 |
| 事务 | ✅ — 更新 Task 状态 + 重置相关 AgentResult                            |

#### deleteTask

| 属性 | 内容                             |
| ---- | -------------------------------- |
| 输入 | `taskId: string`                 |
| 校验 | 属于当前用户                     |
| 返回 | `null`                           |
| 事务 | ✅ — 级联删除 AgentResult → Task |

### 权限

| 方法                 | 权限                  |
| -------------------- | --------------------- |
| `createTask`         | Author (自己的 Novel) |
| `getTaskList`        | Author (自己的)       |
| `getTaskById`        | Author (自己的)       |
| `streamTaskProgress` | Author (自己的)       |
| `retryTask`          | Author (自己的)       |
| `deleteTask`         | Author (自己的)       |

### 异常

| 场景               | 错误码                      |
| ------------------ | --------------------------- |
| 排队已满           | `QUEUE_FULL (3001)`         |
| 任务不存在         | `TASK_NOT_FOUND (3002)`     |
| 非 FAILED 状态重试 | `TASK_STATE_INVALID (3003)` |

### Repository 依赖

- `TaskRepository`
- `AgentResultRepository`

### 外部依赖

- `AIService`
- Redis Pub/Sub (SSE)

---

## 五、ScriptService

**职责**: 剧本聚合根，管理剧本 CRUD + 版本快照 + 回滚

### 方法定义

#### getScriptById

| 属性 | 内容                                                                      |
| ---- | ------------------------------------------------------------------------- |
| 输入 | `scriptId: string`                                                        |
| 返回 | `ScriptDetailResponse { ...content, characters[], currentVersion }`       |
| 流程 | 1. 查 Script（过滤 deletedAt） 2. 查当前 Version.content 3. 查 Characters |
| 缓存 | `script:{id}`, TTL 300s, 更新/回滚时失效                                  |

#### updateScript (saveVersion)

| 属性 | 内容                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 输入 | `scriptId: string`, `UpdateScriptDto { content, note? }`                            |
| 返回 | `ScriptUpdatedResponse { id, currentVersion, updatedAt }`                           |
| 事务 | ✅ `prisma.$transaction` — 1. 创建新 Version 2. Script.currentVersion++ 3. 失效缓存 |
| 并发 | 乐观锁: 基于 `currentVersion` 做 CAS 校验                                           |

#### rollbackScript (publishVersion)

| 属性 | 内容                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------- |
| 输入 | `scriptId: string`, `RollbackDto { version }`                                                     |
| 校验 | version 存在、属于该 Script                                                                       |
| 流程 | 1. 取目标 Version.content 2. 以该 content 创建新 Version（非指针回退） 3. Script.currentVersion++ |
| 事务 | ✅ — 创建 Version + 更新 Script                                                                   |
| 返回 | `RollbackResponse { id, currentVersion }`                                                         |

#### deleteScript (软删除)

| 属性 | 内容                                               |
| ---- | -------------------------------------------------- |
| 输入 | `scriptId: string`                                 |
| 流程 | `ScriptRepository.softDelete(id)` → 设 `deletedAt` |
| 事务 | —                                                  |
| 返回 | `null`                                             |

### 状态流转

无（Script 无业务状态字段，但有 `deletedAt` 软删除标记）

### 权限

| 方法             | 权限            |
| ---------------- | --------------- |
| `getScriptById`  | Author (自己的) |
| `updateScript`   | Author (自己的) |
| `rollbackScript` | Author (自己的) |
| `deleteScript`   | Author (自己的) |

### 异常

| 场景               | 错误码                            |
| ------------------ | --------------------------------- |
| 剧本不存在或已删除 | `SCRIPT_NOT_FOUND (4001)`         |
| 版本不存在         | `VERSION_NOT_FOUND (4002)`        |
| 回滚版本号无效     | `ROLLBACK_VERSION_INVALID (4003)` |

### Repository 依赖

- `ScriptRepository`
- `VersionRepository`

---

## 六、VersionService

**职责**: 版本快照的创建与查询

### 方法定义

#### createVersion

| 属性 | 内容                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| 输入 | `scriptId, content, note?`                                                            |
| 流程 | `VersionRepository.create({ scriptId, versionNumber: autoIncrement, content, note })` |
| 返回 | `Version` 实体                                                                        |
| 事务 | 由调用方（ScriptService）控制                                                         |

#### getVersions

| 属性 | 内容                             |
| ---- | -------------------------------- |
| 输入 | `scriptId: string`               |
| 返回 | `VersionSummaryResponse[]`       |
| 缓存 | `script:{id}:versions`, TTL 300s |

#### getVersionById

| 属性 | 内容                      |
| ---- | ------------------------- |
| 输入 | `scriptId, versionNumber` |
| 返回 | `VersionDetailResponse`   |

### 权限

由 ScriptService 控制，不独立暴露。

### Repository 依赖

- `VersionRepository`

---

## 七、CharacterService

**职责**: 剧本角色管理（依附于 Script 聚合）

### 方法定义

#### getCharactersByScript

| 属性 | 内容                      |
| ---- | ------------------------- |
| 输入 | `scriptId: string`        |
| 返回 | `CharacterResponse[]`     |
| 缓存 | 随 `script:{id}` 一起缓存 |

#### upsertCharacters

| 属性 | 内容                                         |
| ---- | -------------------------------------------- |
| 输入 | `scriptId, characters[]` (AI 生成后批量写入) |
| 流程 | 先删旧数据，再批量写入                       |
| 事务 | ✅ — delete + createMany                     |

### 权限

由 ScriptService 控制。

### Repository 依赖

- `CharacterRepository`

---

## 八、AIService

**职责**: 7 Agent 流水线编排 (含忠实度校验)、LangChain 调用、结果解析

### AI 流水线

```
analyzeNovel → extractCharacters → plotExtraction
                                        ↓
    scenePlanning → generateScript → yamlValidation → polish (可选)
```

### 方法定义

#### enqueueGenerateScript

| 属性   | 内容                                                    |
| ------ | ------------------------------------------------------- |
| 输入   | `taskId: string, novelId: string`                       |
| 队列   | BullMQ `script-generation`, 并发 1, 重试 3 次(指数退避) |
| Worker | `AgentPipeline.run(taskId, novelId)`                    |

#### AgentPipeline.run (内部编排)

| 步骤 | Agent                 | 输入            | 输出                                                    |
| ---- | --------------------- | --------------- | ------------------------------------------------------- |
| 1    | `novelAnalysis`       | 分片文本        | `{ genre, themes, style }`                              |
| 2    | `characterExtraction` | 全文 + 分析结果 | `[{ name, role, traits }]`                              |
| 3    | `plotExtraction`      | 全文 + 人物列表 | `{ plots, conflicts, turningPoints }`                   |
| 4    | `scenePlanning`       | 情节 + 人物     | `[{ sceneNumber, location, time, participants, goal }]` |
| 5    | `scriptGeneration`    | 场景规划 + 人物 | YAML 剧本                                               |
| 6    | `yamlValidation`      | YAML + Schema   | `{ valid, errors[] }`                                   |
| 7    | `scriptPolish` (可选) | YAML + 风格     | 润色后 YAML                                             |

每步完成后: SSE 推事件 → AgentResult 写入 DB → 进度更新

#### analyzeNovel

| 属性   | 内容                                     |
| ------ | ---------------------------------------- |
| 输入   | `chunks: string[], chapterCount: number` |
| Prompt | `novel-analysis.prompt.ts`               |
| 返回   | `{ genre, themes, style }`               |

#### extractCharacters

| 属性   | 内容                                                       |
| ------ | ---------------------------------------------------------- |
| 输入   | `fullText: string, analysisResult: object`                 |
| Prompt | `character-extraction.prompt.ts`                           |
| 返回   | `Character[]` → 写入 `CharacterService.upsertCharacters()` |

#### generateScript

| 属性   | 内容                                        |
| ------ | ------------------------------------------- |
| 输入   | `scenes[], characters[], schemaRef: string` |
| Prompt | `script-generation.prompt.ts`               |
| 返回   | YAML 字符串                                 |

#### validateYaml

| 属性 | 内容                                            |
| ---- | ----------------------------------------------- |
| 输入 | `yaml: string, schemaRules: object`             |
| 校验 | 先本地校验（`yaml-validator.ts`），再 AI 兜底   |
| 返回 | `{ valid: boolean, errors: ValidationError[] }` |

### 文本分片

```
chunkText(novelText)
  → 一级: 章节边界切分
  → 二级: 章节 > 8000 字按段落再切
  → 三级: 语义切片, 5000~8000 字/片
```

### 异常

| 场景              | 错误码 | 处理                  |
| ----------------- | ------ | --------------------- |
| DeepSeek API 超时 | —      | BullMQ 重试 3 次      |
| 输出格式异常      | —      | YAML Validation 兜底  |
| Token 超限        | —      | 三级分片保证 ≤8000 字 |

### 外部依赖

- LangChain.js
- DeepSeek API
- Prompt 模板 (`prompts/*.prompt.ts`)

---

## 九、PolishService

**职责**: AI 润色（异步任务）

### 方法定义

#### polishScript

| 属性 | 内容                                                            |
| ---- | --------------------------------------------------------------- | -------- | ----------- | ----- | ----- | --------- | ------ |
| 输入 | `scriptId: string`, `PolishScriptDto { style, targetSection? }` |
| 风格 | `faithful                                                       | tv_drama | short_drama | anime | movie | tv_series | stage` |
| 流程 | 入队 BullMQ `script-polish`，返回 taskId 供前端轮询             |
| 返回 | `PolishResponse { taskId, status }`                             |
| 队列 | `script-polish`, 并发 1, 重试 2 次                              |

### 权限

| 方法           | 权限            |
| -------------- | --------------- |
| `polishScript` | Author (自己的) |

### Repository 依赖

- `ScriptRepository` (获取当前内容)

---

## 十、ExportService

**职责**: 多格式导出

### 方法定义

#### exportScript

| 属性   | 内容                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| 输入   | `scriptId: string`, `ExportQuery { format }`                                                       |
| 格式   | `yaml` → `text/yaml` / `json` → `application/json` / `md` → `text/markdown` / `txt` → `text/plain` |
| PDF    | 入队 `export-pdf` (Puppeteer)，返回文件流                                                          |
| 文件名 | `{title}_剧本_v{version}.{ext}`                                                                    |

### 权限

| 方法           | 权限            |
| -------------- | --------------- |
| `exportScript` | Author (自己的) |

### 队列

- `export-pdf` — BullMQ, 并发 2, 重试 2 次

### Repository 依赖

- `ScriptRepository`
- `VersionRepository`

---

## 十一、SchemaService

**职责**: YAML Schema 文档

### 方法定义

#### getSchema

| 属性 | 内容                                                       |
| ---- | ---------------------------------------------------------- |
| 输入 | —                                                          |
| 返回 | `SchemaResponse { version, fields[], example, rationale }` |
| 缓存 | `schema:latest`, TTL 3600s                                 |

### 权限

无需认证。

---

## 十二、StorageService

**职责**: MinIO 文件存储抽象

### 方法定义

#### upload

| 属性 | 内容                                                             |
| ---- | ---------------------------------------------------------------- |
| 输入 | `bucket: string, key: string, body: Buffer, contentType: string` |
| 返回 | `fileUrl: string`                                                |

#### download

| 属性 | 内容                          |
| ---- | ----------------------------- |
| 输入 | `bucket: string, key: string` |
| 返回 | `Buffer`                      |

#### delete

| 属性 | 内容                          |
| ---- | ----------------------------- |
| 输入 | `bucket: string, key: string` |

#### cleanupExpired (Cron)

| 属性 | 内容                                                  |
| ---- | ----------------------------------------------------- |
| 触发 | BullMQ `cleanup` — 每天 03:00                         |
| 规则 | `novels/**` 30天 / `temp/**` 30天 / `exports/**` 90天 |

---

## 十三、事务设计汇总

| 方法                                | 事务需求 | 原因                             |
| ----------------------------------- | -------- | -------------------------------- |
| `UserService.resetPassword`         | ✅       | 单表更新，显式事务保证一致       |
| `TaskService.createTask`            | ✅       | Task + 7 AgentResult 原子创建    |
| `TaskService.retryTask`             | ✅       | Task 状态 + AgentResult 批量重置 |
| `TaskService.deleteTask`            | ✅       | AgentResult 级联删除             |
| `ScriptService.updateScript`        | ✅       | Version.insert + Script.update   |
| `ScriptService.rollbackScript`      | ✅       | Version.insert + Script.update   |
| `CharacterService.upsertCharacters` | ✅       | Delete + CreateMany              |
| `NovelService.importNovel`          | 补偿     | MinIO 上传失败需回滚 DB          |

> 实现: `prisma.$transaction([...])`

---

## 十四、缓存设计汇总

| Cache Key              | TTL   | 失效触发                      |
| ---------------------- | ----- | ----------------------------- |
| `script:{id}`          | 300s  | updateScript / rollbackScript |
| `script:{id}:versions` | 300s  | updateScript / rollbackScript |
| `task:{id}`            | 60s   | task 状态变更 (SSE事件)       |
| `user:{id}:quota`      | 600s  | 文件上传 / 删除               |
| `schema:latest`        | 3600s | Schema 更新时 (手动)          |

> 策略: Cache-Aside（读: 查缓存→命中返回/未命中查DB→写缓存 | 写: 写DB→删缓存）

---

## 十五、Controller 映射

| API                  | Controller       | Service 方法                     |
| -------------------- | ---------------- | -------------------------------- |
| A0a POST register    | AuthController   | `UserService.register`           |
| A0b POST login       | AuthController   | `UserService.login`              |
| A0c POST reset-pwd   | AuthController   | `UserService.resetPassword`      |
| A0d GET check        | AuthController   | `UserService.checkAccount`       |
| A1 POST import       | NovelController  | `NovelService.importNovel`       |
| A2 POST tasks        | TaskController   | `TaskService.createTask`         |
| A3 GET tasks         | TaskController   | `TaskService.getTaskList`        |
| A4 GET tasks/:id     | TaskController   | `TaskService.getTaskById`        |
| A5 GET stream        | TaskController   | `TaskService.streamTaskProgress` |
| A6 GET scripts/:id   | ScriptController | `ScriptService.getScriptById`    |
| A7 PUT scripts/:id   | ScriptController | `ScriptService.updateScript`     |
| A8 POST polish       | PolishController | `PolishService.polishScript`     |
| A9 GET schema        | SchemaController | `SchemaService.getSchema`        |
| A10 POST retry       | TaskController   | `TaskService.retryTask`          |
| A11 GET versions     | ScriptController | `VersionService.getVersions`     |
| A12 GET versions/:v  | ScriptController | `VersionService.getVersionById`  |
| A13 POST rollback    | ScriptController | `ScriptService.rollbackScript`   |
| A14 GET export       | ExportController | `ExportService.exportScript`     |
| A15 DELETE tasks/:id | TaskController   | `TaskService.deleteTask`         |

---

## 十六、风险分析

| 编号     | 风险                                  | 等级      | 建议                                       |
| -------- | ------------------------------------- | --------- | ------------------------------------------ |
| RISK-001 | ScriptService.updateScript 无并发控制 | 🔴 High   | 乐观锁: 基于 `currentVersion` CAS          |
| RISK-002 | AI 流水线耗时过长 (> 5min)            | 🔴 High   | BullMQ 异步 + SSE 实时推送                 |
| RISK-003 | 文本分片边界破坏语义完整性            | 🟡 Medium | 三级分片策略（章节→段落→语义）             |
| RISK-004 | TaskService 无主动超时中断            | 🟡 Medium | BullMQ `timeout` 配置 + 定时检查           |
| RISK-005 | Version 表无限增长                    | 🟢 Low    | 单剧本 < 100 版本，可接受                  |
| RISK-006 | 缓存与 DB 数据不一致                  | 🟢 Low    | Cache-Aside + 写操作主动失效               |
| RISK-007 | Polish 与 Script 更新并发冲突         | 🟡 Medium | Polish 入队执行，结果通过 Version 机制合并 |
| RISK-008 | MinIO 上传失败导致 DB/NOSQL 不一致    | 🟡 Medium | 补偿事务: 上传失败回滚 Novel 记录          |
