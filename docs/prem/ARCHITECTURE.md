# Backend Architecture — AI小说转剧本工具

> 基于 RequirementAnalyzer + DesignGenerator + PAGE_SPECS + API_SPECS 输出
> 日期: 2026-06-05 | 技术栈: Express + Prisma + LangChain + BullMQ
> 前端代码已生成: 7 页面 + 7 全局组件 + 7 API 模块 + 3 Store + 2 Hooks

---

## 一、系统概览

**系统名称**: NovelToScript — AI小说转剧本工具

**系统职责**:

| 职责域      | 说明                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| 用户管理    | 注册、登录、密码重置、JWT 鉴权                                            |
| 小说管理    | 导入（txt/docx/md ≤20MB）、章节识别（五级兜底）、文本分片存储             |
| AI 剧本生成 | 7 Agent 流水线：分析→角色提取→情节提取→场景规划→剧本生成→YAML校验→润色    |
| 剧本编辑    | CRUD、版本历史、Schema 校验、回滚                                         |
| 导出服务    | yaml/json/md/txt 直接下载，PDF 双方案（Puppeteer 正式 / 前端 jsPDF 快速） |
| 文件管理    | MinIO 存储，生命周期管理（原文+中间 30d，最终剧本永久）                   |
| 任务调度    | BullMQ 队列，运行 1 / 排队 3，支持断点重试                                |
| 实时推送    | SSE 推送 Agent 流水线进度                                                 |

---

## 二、架构风格

**推荐**: Modular Monolith（模块化单体）

**原因**:

- 开发效率高，单仓库便于快速迭代
- 部署简单，Docker 单容器即可运行
- 维护成本低，适合当前项目规模（7 页面 + 17 API）
- 模块边界清晰，未来可按需拆分为微服务

```
┌─────────────────────────────────────────┐
│            Express Application           │
│  ┌────────┐ ┌────────┐ ┌─────────────┐  │
│  │  Auth  │ │ Script │ │ AI Pipeline  │  │
│  │ Module │ │ Module │ │   Module     │  │
│  ├────────┤ ├────────┤ ├─────────────┤  │
│  │ Novel  │ │ Export │ │  Task        │  │
│  │ Module │ │ Module │ │  Module      │  │
│  └────────┘ └────────┘ └─────────────┘  │
│         Shared Kernel (DTO/Utils)        │
└─────────────────────────────────────────┘
```

---

## 三、业务模块

| 模块        | 路径前缀                  | 职责                                           |
| ----------- | ------------------------- | ---------------------------------------------- |
| **Auth**    | `/api/auth`               | 注册、登录、密码重置、账号检查、JWT 签发与验证 |
| **User**    | `/api/users`              | 用户信息管理、存储配额查询                     |
| **Novel**   | `/api/novels`             | 小说导入、章节识别、文本分片、原文存储         |
| **Task**    | `/api/tasks`              | 分析任务创建、列表、详情、SSE 进度、重试       |
| **Script**  | `/api/scripts`            | 剧本 CRUD、版本历史、回滚                      |
| **Export**  | `/api/scripts/:id/export` | 多格式导出（yaml/json/md/txt/pdf）             |
| **Polish**  | `/api/scripts/:id/polish` | AI 润色（7 种风格可选）                        |
| **Schema**  | `/api/schema`             | YAML Schema 定义文档                           |
| **AI**      | 内部模块                  | LangChain Agent 编排（7 Agent 流水线）         |
| **Storage** | 内部模块                  | MinIO 文件上传/下载/生命周期管理               |

---

## 四、领域模型

### 实体关系

```
User 1 ──── N Script
User 1 ──── N Novel
Novel 1 ──── 1 Task
Novel 1 ──── 1 Script
Script 1 ──── N Version
Script N ──── N Character
Version 1 ──── N Scene
Scene 1 ──── N Dialogue
Task 1 ──── N AgentResult
```

### 实体定义

```
User
  id, username, account, passwordHash, storageUsed, createdAt

Novel
  id, userId, title, author, rawText, chapterCount, wordCount, fileFormat, filePath, createdAt

Task
  id, novelId, userId, status(queued|processing|completed|failed), progress,
  currentAgent, resumeFromAgent, retryMode, errorMessage, startedAt, completedAt

AgentResult
  id, taskId, agentName, status, output(JSON), startedAt, completedAt

Script
  id, userId, novelId, title, content(YAML), currentVersion, createdAt, updatedAt

Version
  id, scriptId, versionNumber, content, note, createdAt

Character
  id, scriptId, name, role, description, traits(JSON)

Scene
  id, versionId, sceneNumber, location, time, participants(JSON)

Dialogue
  id, sceneId, speaker, text, sequence
```

---

## 五、聚合边界

| 聚合根      | 包含实体           | 说明                                              |
| ----------- | ------------------ | ------------------------------------------------- |
| **User**    | —                  | 独立聚合，管理认证与配额                          |
| **Novel**   | —                  | 独立聚合，管理原文导入                            |
| **Task**    | AgentResult        | Task 是聚合根，AgentResult 依附于 Task            |
| **Script**  | Version, Character | Script 是聚合根，Version + Character 不可独立存在 |
| **Version** | Scene, Dialogue    | Version 是聚合根，Scene + Dialogue 依附于 Version |

**聚合规则**:

- 跨聚合引用使用 ID（不用对象引用）
- 同一聚合内保证事务一致性
- Script 更新时同时写入新 Version 快照

---

## 六、分层架构

```
┌─────────────────────────────────────────┐
│              Route Layer                 │  ← 路由注册 + 中间件挂载
├─────────────────────────────────────────┤
│           Controller Layer               │  ← 请求解析、参数校验、响应格式化
├─────────────────────────────────────────┤
│            Service Layer                 │  ← 业务逻辑编排、事务管理
├─────────────────────────────────────────┤
│          Repository Layer                │  ← Prisma 数据访问、查询封装
├─────────────────────────────────────────┤
│         Infrastructure Layer             │  ← MinIO、Redis、BullMQ、LangChain
└─────────────────────────────────────────┘
```

### 每模块分层清单

| 模块    | Controller       | Service                  | Repository                          | DTO                                | Validator       |
| ------- | ---------------- | ------------------------ | ----------------------------------- | ---------------------------------- | --------------- |
| Auth    | AuthController   | AuthService              | UserRepository                      | RegisterDto, LoginDto, ResetPwdDto | AuthValidator   |
| Novel   | NovelController  | NovelService             | NovelRepository                     | ImportNovelDto                     | NovelValidator  |
| Task    | TaskController   | TaskService              | TaskRepository                      | CreateTaskDto, RetryTaskDto        | TaskValidator   |
| Script  | ScriptController | ScriptService            | ScriptRepository, VersionRepository | UpdateScriptDto, RollbackDto       | ScriptValidator |
| Export  | ExportController | ExportService            | —                                   | ExportQueryDto                     | —               |
| Polish  | PolishController | PolishService            | —                                   | PolishDto                          | —               |
| Schema  | SchemaController | SchemaService            | —                                   | —                                  | —               |
| AI      | —                | AIService, AgentPipeline | —                                   | AgentInputDto, AgentOutputDto      | —               |
| Storage | —                | StorageService           | —                                   | —                                  | FileValidator   |

---

## 七、目录结构

```
server/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.ts                     # Express 配置
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── reset-pwd.dto.ts
│   │   │   └── auth.validator.ts
│   │   │
│   │   ├── novel/
│   │   │   ├── novel.controller.ts
│   │   │   ├── novel.service.ts
│   │   │   ├── novel.repository.ts
│   │   │   ├── novel.routes.ts
│   │   │   └── dto/
│   │   │
│   │   ├── task/
│   │   │   ├── task.controller.ts
│   │   │   ├── task.service.ts
│   │   │   ├── task.repository.ts
│   │   │   ├── task.routes.ts
│   │   │   ├── task.sse.ts          # SSE 推送管理
│   │   │   └── dto/
│   │   │
│   │   ├── script/
│   │   │   ├── script.controller.ts
│   │   │   ├── script.service.ts
│   │   │   ├── script.repository.ts
│   │   │   ├── script.routes.ts
│   │   │   ├── version.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── export/
│   │   │   ├── export.controller.ts
│   │   │   ├── export.service.ts
│   │   │   └── export.routes.ts
│   │   │
│   │   ├── polish/
│   │   │   ├── polish.controller.ts
│   │   │   ├── polish.service.ts
│   │   │   └── polish.routes.ts
│   │   │
│   │   ├── schema/
│   │   │   ├── schema.controller.ts
│   │   │   ├── schema.service.ts
│   │   │   └── schema.routes.ts
│   │   │
│   │   └── ai/
│   │       ├── ai.service.ts            # AI 编排服务
│   │       ├── agent-pipeline.ts        # 7 Agent 流水线编排
│   │       ├── agents/
│   │       │   ├── novel-analysis.agent.ts
│   │       │   ├── character-extraction.agent.ts
│   │       │   ├── plot-extraction.agent.ts
│   │       │   ├── scene-planning.agent.ts
│   │       │   ├── script-generation.agent.ts
│   │       │   ├── yaml-validation.agent.ts
│   │       │   └── script-polish.agent.ts
│   │       ├── prompts/
│   │       │   ├── novel-analysis.prompt.ts
│   │       │   ├── character-extraction.prompt.ts
│   │       │   ├── plot-extraction.prompt.ts
│   │       │   ├── scene-planning.prompt.ts
│   │       │   ├── script-generation.prompt.ts
│   │       │   ├── yaml-validation.prompt.ts
│   │       │   └── polish.prompt.ts
│   │       └── text-chunker.ts           # 三级分片策略
│   │
│   ├── shared/
│   │   ├── database/
│   │   │   └── prisma.ts                 # Prisma Client 单例
│   │   ├── cache/
│   │   │   └── redis.ts                  # Redis 连接管理
│   │   ├── queue/
│   │   │   ├── queue-manager.ts          # BullMQ 队列管理
│   │   │   └── jobs/
│   │   │       ├── script-generation.job.ts
│   │   │       ├── export-pdf.job.ts
│   │   │       └── cleanup.job.ts
│   │   └── storage/
│   │       ├── minio.ts                  # MinIO Client
│   │       └── lifecycle.ts             # 生命周期策略
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts            # JWT 验证
│   │   ├── rate-limit.middleware.ts      # 速率限制
│   │   ├── upload.middleware.ts          # multer 文件上传
│   │   └── error-handler.middleware.ts   # 全局错误处理
│   │
│   ├── config/
│   │   ├── env.ts                        # dotenv 配置加载
│   │   ├── deepseek.ts                   # DeepSeek API 配置
│   │   └── cors.ts                       # CORS 配置
│   │
│   └── utils/
│       ├── jwt.ts                        # JWT 签发/验证
│       ├── yaml-validator.ts             # YAML Schema 校验
│       ├── chapter-detector.ts           # 章节识别（五级策略）
│       └── pdf-renderer.ts               # Puppeteer PDF 渲染
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── storage/                              # MinIO 本地开发目录
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env
```

---

## 八、数据库设计

**数据库**: SQLite（开发/单机） → 可迁移至 PostgreSQL（生产）
**ORM**: Prisma

### 核心表

| 表名            | 说明       | 关键字段                                                         |
| --------------- | ---------- | ---------------------------------------------------------------- |
| `users`         | 用户       | id, username, account(UNIQUE), passwordHash, storageUsed         |
| `novels`        | 小说原文   | id, userId(FK), title, author, rawText, chapterCount, fileFormat |
| `tasks`         | 分析任务   | id, novelId(FK), userId(FK), status, progress, currentAgent      |
| `agent_results` | Agent 结果 | id, taskId(FK), agentName, status, output(JSON)                  |
| `scripts`       | 剧本       | id, userId(FK), novelId(FK), title, content, currentVersion      |
| `versions`      | 版本快照   | id, scriptId(FK), versionNumber, content, note                   |
| `characters`    | 人物       | id, scriptId(FK), name, role, traits(JSON)                       |
| `scenes`        | 场景       | id, versionId(FK), sceneNumber, location, time                   |
| `dialogues`     | 对白       | id, sceneId(FK), speaker, text, sequence                         |

### 索引建议

| 表              | 索引字段                   | 用途            |
| --------------- | -------------------------- | --------------- |
| `users`         | account                    | 登录查询        |
| `novels`        | userId, createdAt          | 用户小说列表    |
| `tasks`         | userId + status, createdAt | 任务列表 + 筛选 |
| `scripts`       | userId, novelId            | 剧本归属查询    |
| `versions`      | scriptId + versionNumber   | 版本查询        |
| `agent_results` | taskId + agentName         | Agent 结果查询  |

### 唯一约束

- `users.account` — 账号不可重复
- `scripts` (userId, novelId) — 同一用户同一小说只有一个剧本
- `versions` (scriptId, versionNumber) — 版本号在剧本内唯一

---

## 九、缓存设计

**缓存**: Redis

### 缓存项

| Key                    | 内容                       | TTL   | 失效策略            |
| ---------------------- | -------------------------- | ----- | ------------------- |
| `script:{id}`          | 剧本详情（含当前版本内容） | 300s  | 更新/回滚时删除     |
| `script:{id}:versions` | 版本列表                   | 300s  | 保存/回滚时删除     |
| `task:{id}`            | 任务详情（含 Agent 结果）  | 60s   | 任务完成/失败时删除 |
| `user:{id}:quota`      | 用户存储配额               | 600s  | 文件上传/删除时删除 |
| `schema:latest`        | YAML Schema 最新版本       | 3600s | Schema 更新时删除   |
| `rate:{ip}`            | IP 速率限制计数器          | 60s   | 自动过期            |

### 缓存模式

```
Cache-Aside

读取: 查缓存 → 命中返回 / 未命中查DB → 写缓存 → 返回
写入: 写DB → 删缓存
```

---

## 十、队列设计

**队列**: BullMQ (Redis-backed)

### 队列定义

| 队列名              | 用途               | 并发 | 重试           |
| ------------------- | ------------------ | ---- | -------------- |
| `script-generation` | 7 Agent 流水线执行 | 1    | 3 次, 指数退避 |
| `script-polish`     | AI 润色任务        | 1    | 2 次           |
| `export-pdf`        | Puppeteer PDF 导出 | 2    | 2 次           |
| `cleanup`           | 30 天过期文件清理  | 1    | 1 次           |

### Job 定义

```
GenerateScriptJob
  Payload:  { userId, novelId, taskId }
  Result:   { scriptId }
  进度上报: SSE 推送每阶段状态

PolishScriptJob
  Payload:  { scriptId, style, targetSection }
  Result:   { polishedContent }

ExportPdfJob
  Payload:  { scriptId, format: 'pdf' }
  Result:   { fileUrl }

CleanupJob (Cron: 每天 03:00)
  Payload:  {}
  Result:   { deletedCount }
```

### 死信队列

```
script-generation-dlq
export-pdf-dlq
```

失败超过重试次数后进入 DLQ，管理员可手动重放。

---

## 十一、文件存储设计

**存储**: MinIO (S3-compatible)

### Bucket 设计

| Bucket    | 内容               | 生命周期      | 大小限制    |
| --------- | ------------------ | ------------- | ----------- |
| `novels`  | 上传的小说原文     | 30 天自动删除 | 单文件 20MB |
| `scripts` | 最终剧本 YAML      | 永久保存      | —           |
| `exports` | 导出文件（PDF 等） | 90 天自动删除 | —           |
| `temp`    | AI 中间结果        | 30 天自动删除 | —           |

### 存储路径规范

```
novels/{userId}/{novelId}/original.{ext}
scripts/{userId}/{scriptId}/v{version}.yaml
exports/{userId}/{scriptId}/script_v{version}.{format}
temp/{taskId}/{agentName}/result.json
```

### 生命周期策略

```
MinIO Lifecycle Rule:
  novels/**  → Expiration: 30 days
  temp/**    → Expiration: 30 days
  exports/** → Expiration: 90 days

清理检查:
  用户 storageUsed > 500MB → 拒绝上传 → 提示清理
```

---

## 十二、AI 工作流

### 流水线总览

```
POST /api/tasks (创建任务)
        ↓
BullMQ: script-generation Queue
        ↓
┌───────────────────────────────────────────┐
│ Agent 1: Novel Analysis                   │
│ 输入: 小说分片文本                          │
│ 输出: { chapters, genre, themes, style }  │
│ 耗时: ~3s                                  │
├───────────────────────────────────────────┤
│ Agent 2: Character Extraction             │
│ 输入: 小说全文 + Agent 1 输出               │
│ 输出: [{ name, role, traits, relations }] │
│ 耗时: ~15s                                 │
├───────────────────────────────────────────┤
│ Agent 3: Plot Extraction                  │
│ 输入: 全文 + 人物列表                       │
│ 输出: { mainPlots, conflicts, turningPoints, climax, ending } │
│ 耗时: ~45s                                 │
├───────────────────────────────────────────┤
│ Agent 4: Scene Planning                   │
│ 输入: 情节 + 人物                           │
│ 输出: [{ sceneNumber, location, time, participants, goal }] │
│ 耗时: ~60s                                 │
├───────────────────────────────────────────┤
│ Agent 5: Script Generation               │
│ 输入: 场景规划 + 人物                        │
│ 输出: YAML 剧本内容                          │
│ 耗时: ~90s                                 │
├───────────────────────────────────────────┤
│ Agent 6: YAML Validation                  │
│ 输入: YAML 剧本 + Schema                   │
│ 输出: { valid, errors[] }                 │
│ 耗时: ~2s                                  │
├───────────────────────────────────────────┤
│ Agent 7: Script Polish (可选)             │
│ 输入: 剧本 + 风格选择                        │
│ 输出: 润色后 YAML                           │
│ 耗时: ~30s                                 │
└───────────────────────────────────────────┘
        ↓
保存 Script + Version + Character + Scene
        ↓
SSE: task-complete {scriptId}
```

### 文本分片策略

```
一级: 章节分片 — 按章节边界切分
二级: 段落切片 — 章节 > 8000 字时按段落边界再切
三级: 语义切片 — 保持语义完整性，5000~8000 字/片

每个分片独立送入 Agent，结果按章节聚合
```

### Prompt 层设计

| Prompt 文件                      | 模板变量                        | 输出格式                       |
| -------------------------------- | ------------------------------- | ------------------------------ |
| `novel-analysis.prompt.ts`       | {text, chapterCount}            | JSON (chapters, genre, themes) |
| `character-extraction.prompt.ts` | {text, analysisResult}          | JSON (characters[])            |
| `plot-extraction.prompt.ts`      | {text, characters}              | JSON (plots, conflicts)        |
| `scene-planning.prompt.ts`       | {plots, characters}             | JSON (scenes[])                |
| `script-generation.prompt.ts`    | {scenes, characters, schemaRef} | YAML                           |
| `yaml-validation.prompt.ts`      | {yaml, schemaRules}             | JSON (valid, errors)           |
| `polish.prompt.ts`               | {yaml, style, targetSection}    | YAML                           |

### 润色风格

```
polish.prompt.ts 接收 style 参数:
  "faithful"     → 原著还原
  "tv_drama"     → 影视剧风格
  "short_drama"  → 短剧风格
  "anime"        → 动漫风格
  "movie"        → 电影风格
  "tv_series"    → 电视剧风格
  "stage"        → 舞台剧风格
```

---

## 十三、权限架构

### 角色定义

| 角色              | 权限范围                   |
| ----------------- | -------------------------- |
| **Author** (默认) | 管理自己的小说、任务、剧本 |
| **Admin**         | 管理所有用户、查看所有数据 |

### 权限矩阵

| 操作               | Author          | Admin     |
| ------------------ | --------------- | --------- |
| 注册/登录/重置密码 | ✅              | ✅        |
| 导入小说           | ✅ (自己)       | ✅        |
| 创建分析任务       | ✅ (自己的小说) | ✅        |
| 查看任务           | ✅ (自己的)     | ✅ (全部) |
| 编辑剧本           | ✅ (自己的)     | ✅ (全部) |
| 导出剧本           | ✅ (自己的)     | ✅ (全部) |
| 删除任务           | ✅ (自己的)     | ✅ (全部) |
| 管理用户           | ❌              | ✅        |

### 鉴权流程

```
请求 → AuthMiddleware
         ├─ 提取 Authorization: Bearer <token>
         ├─ JWT 验证 → 解析 userId + role
         ├─ req.user = { userId, role }
         └─ next()
              ↓
         Controller 内通过 req.user.userId 做数据隔离
         (Author 只能操作自己的资源)
```

---

## 十四、安全设计

### 防护措施

| 层级     | 措施                  | 说明                                    |
| -------- | --------------------- | --------------------------------------- |
| 认证     | JWT (HS256)           | Token 有效期 7 天，refresh 可选         |
| 授权     | RBAC                  | Author/Admin 角色隔离                   |
| 速率限制 | express-rate-limit    | `/api/auth/*` 5次/分钟, 通用 100次/分钟 |
| 输入校验 | Zod / class-validator | 所有 DTO 必校验                         |
| 密码     | bcrypt hash           | saltRounds=12                           |

### 上传安全

| 允许    | 禁止                      |
| ------- | ------------------------- |
| `.txt`  | `.exe` `.js` `.bat` `.sh` |
| `.docx` | `.php` `.py` `.dll`       |
| `.md`   | 任何可执行文件            |

- MIME 类型白名单校验（multer fileFilter）
- 文件魔数（magic bytes）校验
- 单文件 ≤ 20MB（multer limits）

### AI 安全

| 风险             | 防护                               |
| ---------------- | ---------------------------------- |
| Prompt Injection | 用户文本先经 sanitize 过滤特殊指令 |
| 输出格式异常     | YAML Validation Agent 兜底校验     |
| Token 超限       | 三级分片确保单次 ≤ 8000 字         |
| API Key 泄露     | dotenv 管理，不提交 Git            |

---

## 十五、扩展性设计

### 抽象接口

```typescript
// LLM Provider 抽象 — 方便切换模型
interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResult>;
}

class DeepSeekProvider implements LLMProvider {
  /* ... */
}
// class OpenAIProvider implements LLMProvider { /* ... */ }

// Storage Provider 抽象 — 方便切换存储
interface StorageProvider {
  upload(bucket: string, key: string, body: Buffer): Promise<string>;
  download(bucket: string, key: string): Promise<Buffer>;
  delete(bucket: string, key: string): Promise<void>;
}

class MinioProvider implements StorageProvider {
  /* ... */
}
// class S3Provider implements StorageProvider { /* ... */ }

// Queue Provider 抽象
interface QueueProvider {
  add(name: string, data: object): Promise<Job>;
  process(name: string, handler: JobHandler): void;
}
```

### 扩展点

| 扩展点 | 当前实现  | 可替换为                   |
| ------ | --------- | -------------------------- |
| LLM    | DeepSeek  | OpenAI / Claude / 本地模型 |
| 数据库 | SQLite    | PostgreSQL / MySQL         |
| 存储   | MinIO     | AWS S3 / 阿里云 OSS        |
| 缓存   | Redis     | Redis Cluster / KeyDB      |
| 队列   | BullMQ    | RabbitMQ / Kafka           |
| PDF    | Puppeteer | Gotenberg / PrinceXML      |

---

## 十六、部署建议

### 容器规划

```
docker-compose.yml
├── frontend    (Vue 3, Nginx, :80)
├── backend     (Node.js, Express, :3000)
├── redis       (Redis 7, :6379)
└── minio       (MinIO, :9000 + :9001 console)
```

### 环境变量

```env
# .env
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
DEEPSEEK_API_KEY="sk-xxx"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
JWT_SECRET="your-secret-key"
PUPPETEER_EXECUTABLE="/usr/bin/chromium"
```

### Dockerfile (Backend)

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 十七、技术选型总结

| 类别       | 技术               | 版本建议 | 用途            |
| ---------- | ------------------ | -------- | --------------- |
| Runtime    | Node.js            | ≥20 LTS  | 运行环境        |
| Framework  | Express            | 4.x      | HTTP 服务       |
| Language   | TypeScript         | 5.x      | 类型安全        |
| ORM        | Prisma             | 5.x      | 数据建模 + 迁移 |
| Database   | SQLite             | 3.x      | 主数据存储      |
| Cache      | Redis              | 7.x      | 缓存 + 队列后端 |
| Queue      | BullMQ             | 5.x      | 异步任务        |
| Storage    | MinIO              | latest   | 文件存储        |
| AI         | LangChain.js       | 0.3.x    | Agent 编排      |
| LLM        | DeepSeek API       | v2       | 大语言模型      |
| PDF        | Puppeteer          | 22.x     | PDF 渲染        |
| Auth       | jsonwebtoken       | 9.x      | JWT             |
| Validation | Zod                | 3.x      | DTO 校验        |
| Upload     | multer             | 1.x      | 文件上传        |
| Rate Limit | express-rate-limit | 7.x      | 速率限制        |

---

## 十八、架构风险分析

| 编号     | 风险                             | 等级      | 影响               | 缓解措施                                  |
| -------- | -------------------------------- | --------- | ------------------ | ----------------------------------------- |
| RISK-001 | AI 调用耗时长导致请求超时        | 🔴 High   | 用户体验差         | BullMQ 异步化 + SSE 推送进度              |
| RISK-002 | DeepSeek API 不可用              | 🟡 Medium | 核心功能中断       | 队列重试 + 死信队列 + 降级提示            |
| RISK-003 | SQLite 并发写入瓶颈              | 🟡 Medium | 多用户时性能下降   | WAL 模式 + 后续迁移 PostgreSQL            |
| RISK-004 | 长文本全文存储导致 DB 膨胀       | 🟡 Medium | 查询变慢           | 原文存 MinIO，DB 仅存元数据               |
| RISK-005 | MinIO 单点故障                   | 🟢 Low    | 文件不可访问       | 本地开发可接受；生产建议 MinIO 集群       |
| RISK-006 | Puppeteer 内存占用大             | 🟢 Low    | PDF 导出时内存峰值 | 限制并发 2，超时 30s 自动 kill            |
| RISK-007 | YAML Schema 升级后旧剧本校验失败 | 🟢 Low    | 历史剧本报错       | Schema 多版本共存，旧剧本用旧 Schema      |
| RISK-008 | 单用户 500MB 限制被绕过          | 🟢 Low    | 存储滥用           | 上传前查 storageUsed + 文件大小，超限拒绝 |

---

## 附录: API ↔ 模块映射

| API                              | 模块   | Controller                    | 前端 API 模块     |
| -------------------------------- | ------ | ----------------------------- | ----------------- |
| POST /api/auth/register          | Auth   | AuthController.register       | `api/auth.ts`     |
| POST /api/auth/login             | Auth   | AuthController.login          | `api/auth.ts`     |
| POST /api/auth/reset-password    | Auth   | AuthController.resetPassword  | `api/auth.ts`     |
| POST /api/novels/import          | Novel  | NovelController.import        | `api/novels.ts`   |
| POST /api/tasks                  | Task   | TaskController.create         | `api/tasks.ts`    |
| GET /api/tasks                   | Task   | TaskController.list           | `api/tasks.ts`    |
| GET /api/tasks/:id               | Task   | TaskController.getById        | `api/tasks.ts`    |
| GET /api/tasks/:id/stream        | Task   | TaskController.streamSSE      | `api/tasksSSE.ts` |
| POST /api/tasks/:id/retry        | Task   | TaskController.retry          | `api/tasks.ts`    |
| GET /api/scripts/:id             | Script | ScriptController.getById      | `api/scripts.ts`  |
| PUT /api/scripts/:id             | Script | ScriptController.update       | `api/scripts.ts`  |
| GET /api/scripts/:id/versions    | Script | ScriptController.listVersions | `api/scripts.ts`  |
| GET /api/scripts/:id/versions/:v | Script | ScriptController.getVersion   | `api/scripts.ts`  |
| POST /api/scripts/:id/rollback   | Script | ScriptController.rollback     | `api/scripts.ts`  |
| POST /api/scripts/:id/polish     | Polish | PolishController.polish       | `api/scripts.ts`  |
| GET /api/scripts/:id/export      | Export | ExportController.export       | `api/scripts.ts`  |
| GET /api/schema                  | Schema | SchemaController.get          | `api/schema.ts`   |

---

## 附录: 前后端同步状态

### 前端已生成 → 后端待实现

| 前端模块                               | 对应后端模块         | 状态      |
| -------------------------------------- | -------------------- | --------- |
| `api/request.ts` (Axios + JWT)         | Auth                 | 🟡 待联调 |
| `api/auth.ts` (注册/登录/重置/检查)    | Auth                 | 🟡 待联调 |
| `api/novels.ts` (FormData 上传)        | Novel                | 🟡 待联调 |
| `api/tasks.ts` (CRUD + 重试)           | Task                 | 🟡 待联调 |
| `api/tasksSSE.ts` (SSE 进度)           | Task                 | 🟡 待联调 |
| `api/scripts.ts` (CRUD+润色+版本+导出) | Script/Polish/Export | 🟡 待联调 |
| `api/schema.ts` (Schema 查询)          | Schema               | 🟡 待联调 |
| `stores/auth.ts` (Token/User)          | Auth                 | 🟡 待联调 |
| `stores/notification.ts` (消息队列)    | — (SSE Push)         | 🟡 待联调 |
| `stores/theme.ts` (暗色模式)           | — (纯前端)           | ✅ 独立   |
| `hooks/useSSE.ts` (SSE 自动重连)       | Task SSE             | 🟡 待联调 |
| `hooks/useCache.ts` (IndexedDB)        | — (纯前端)           | ✅ 独立   |

### 页面 → 后端模块依赖

| 页面                | 依赖的后端模块                     |
| ------------------- | ---------------------------------- |
| P0 AuthPage         | Auth (注册/登录/重置)              |
| P1 HomePage         | Task (任务列表)                    |
| P2 ImportPage       | Novel (上传) + Task (创建)         |
| P3 TaskListPage     | Task (列表/删除/重试)              |
| P4 TaskDetailPage   | Task (详情/SSE)                    |
| P5 ScriptEditorPage | Script + Polish + Export + Version |
| P6 SchemaPage       | Schema                             |

### 后端初始化待办

1. 初始化 `server/` 项目 (Express + TypeScript)
2. Prisma migrate + seed
3. 实现 Auth 模块 (注册/登录/JWT)
4. 实现 Novel 模块 (multer 上传 + 章节识别)
5. 实现 Task 模块 (CRUD + SSE)
6. 实现 Script 模块 (CRUD + 版本 + 回滚)
7. 实现 AI Pipeline (LangChain 7 Agent)
8. 实现 Export 模块 (yaml/json/md/txt/pdf)
9. 实现 Polish 模块 (7 风格润色)
10. 实现 Schema 模块
11. Redis + BullMQ + MinIO 集成
