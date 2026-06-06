# REPOSITORY_SPECS — Repository 层设计

> 基于 DATABASE_SCHEMA (9表4枚举) + SERVICE_SPECS (11 Service) 生成
> 日期: 2026-06-05 | ORM: Prisma 7 | DB: SQLite

---

## 一、Repository 清单

| Repository                | 对应表          | 被谁调用                                    |
| ------------------------- | --------------- | ------------------------------------------- |
| **UserRepository**        | `users`         | UserService                                 |
| **NovelRepository**       | `novels`        | NovelService                                |
| **TaskRepository**        | `tasks`         | TaskService                                 |
| **AgentResultRepository** | `agent_results` | TaskService (内部)                          |
| **ScriptRepository**      | `scripts`       | ScriptService, PolishService, ExportService |
| **VersionRepository**     | `versions`      | VersionService, ScriptService               |
| **CharacterRepository**   | `characters`    | CharacterService                            |
| **SceneRepository**       | `scenes`        | (AI 写入，通过 Version 查询)                |
| **DialogueRepository**    | `dialogues`     | (AI 写入，通过 Scene 查询)                  |

> Repository 统一注入 `PrismaClient` 单例（来自 `@/shared/database/prisma.ts`）。

---

## 二、UserRepository

**职责**: `users` 表访问

### CRUD

```ts
class UserRepository {
  findById(id: string): Promise<User | null>;
  findByAccount(account: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### 关键方法

| 方法             | Prisma 实现                                      | 用途          |
| ---------------- | ------------------------------------------------ | ------------- |
| `findByAccount`  | `prisma.user.findUnique({ where: { account } })` | 登录/注册查重 |
| `findByUsername` | `prisma.user.findFirst({ where: { username } })` | 密码重置验证  |

### 关联查询

无需关联（User 是独立聚合根）。

---

## 三、NovelRepository

**职责**: `novels` 表访问

### CRUD

```ts
class NovelRepository {
  findById(id: string): Promise<Novel | null>;
  findMany(query: NovelQuery): Promise<{ list: Novel[]; total: number }>;
  create(data: CreateNovelData): Promise<Novel>;
  delete(id: string): Promise<void>;
}
```

### 筛选规范

```ts
interface NovelQuery {
  userId: string; // 必填：数据隔离
  keyword?: string; // 书名模糊搜索 (title CONTAINS)
  fileFormat?: "TXT" | "DOCX" | "MD";
  page?: number; // 默认 1
  pageSize?: number; // 默认 20, 最大 100
  sortBy?: "createdAt"; // 默认 createdAt
  sortOrder?: "asc" | "desc"; // 默认 desc
}
```

### Prisma 实现建议

```ts
async findMany(query: NovelQuery) {
  const where = {
    userId: query.userId,
    ...(query.fileFormat && { fileFormat: query.fileFormat }),
    ...(query.keyword && { title: { contains: query.keyword } }),
  }
  const [list, total] = await Promise.all([
    prisma.novel.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { [query.sortBy]: query.sortOrder },
    }),
    prisma.novel.count({ where }),
  ])
  return { list, total }
}
```

### 索引依赖

- `@@index([userId, createdAt])` — 按用户分页查询

---

## 四、TaskRepository

**职责**: `tasks` 表访问 + 队列状态查询

### CRUD

```ts
class TaskRepository {
  findById(id: string): Promise<Task | null>;
  findMany(query: TaskQuery): Promise<{ list: Task[]; total: number }>;
  create(data: CreateTaskData): Promise<Task>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
  count(query: TaskCountQuery): Promise<number>;

  // 特殊
  findPendingTasks(): Promise<Task[]>; // status = QUEUED
  findFailedTasks(): Promise<Task[]>; // status = FAILED
  findByNovelId(novelId: string): Promise<Task | null>;
}
```

### 筛选规范

```ts
interface TaskQuery {
  userId: string;
  status?: string; // 逗号分隔: "QUEUED,PROCESSING"
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}
```

### 关联查询

```ts
// 查详情时 include AgentResult
findByIdWithResults(id: string): Promise<Task & { agentResults: AgentResult[] } | null>
```

```ts
prisma.task.findUnique({
  where: { id },
  include: { agentResults: { orderBy: { createdAt: "asc" } } },
});
```

### 索引依赖

- `@@index([userId, status])` — 用户任务筛选
- `@@index([status, createdAt])` — 队列调度查询
- `novelId @unique` — 按小说查唯一任务

---

## 五、AgentResultRepository

**职责**: `agent_results` 表访问（被 TaskService 内部使用）

### CRUD

```ts
class AgentResultRepository {
  findByTaskId(taskId: string): Promise<AgentResult[]>;
  createMany(data: CreateAgentResultData[]): Promise<number>;
  update(
    taskId: string,
    agentName: string,
    data: UpdateAgentResultData,
  ): Promise<AgentResult>;
  resetByTaskId(taskId: string): Promise<number>; // restart 模式
}
```

### 关键方法

| 方法            | 说明                                  |
| --------------- | ------------------------------------- |
| `createMany`    | Task 创建时批量写入 7 条 PENDING 记录 |
| `update`        | Agent 执行完毕更新状态+输出           |
| `resetByTaskId` | 重试(restart)时批量重置为 PENDING     |

### 索引依赖

- `@@unique([taskId, agentName])` — 唯一性 + 快速查询

---

## 六、ScriptRepository

**职责**: `scripts` 表访问（聚合根 + 软删除）

### CRUD

```ts
class ScriptRepository {
  findById(id: string): Promise<Script | null>;
  findByNovelId(novelId: string): Promise<Script | null>;
  findByUserId(
    userId: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ list: Script[]; total: number }>;
  create(data: CreateScriptData): Promise<Script>;
  update(id: string, data: UpdateScriptData): Promise<Script>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>; // 恢复软删除
}
```

### 软删除策略

```ts
// 所有查询默认过滤已删除
const DEFAULT_WHERE = { deletedAt: null }

async findById(id: string) {
  return prisma.script.findFirst({
    where: { id, deletedAt: null }
  })
}

async softDelete(id: string) {
  return prisma.script.update({
    where: { id },
    data: { deletedAt: new Date() }
  })
}
```

### 关联查询

```ts
// 含当前版本内容 + 人物列表
findByIdWithDetail(id: string) {
  return prisma.script.findFirst({
    where: { id, deletedAt: null },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1  // 只取最新版本
      },
      characters: true
    }
  })
}
```

### 特殊方法

| 方法               | 用途                                               |
| ------------------ | -------------------------------------------------- |
| `findByNovelId`    | 检查小说是否已有剧本 (1:1)                         |
| `findByUserId`     | 用户剧本列表                                       |
| `incrementVersion` | CAS 乐观锁: `{ currentVersion: { increment: 1 } }` |

### 索引依赖

- `novelId @unique` — 按小说查唯一剧本
- `@@index([deletedAt])` — 软删除过滤

---

## 七、VersionRepository

**职责**: `versions` 表访问（只追加，不更新）

### CRUD

```ts
class VersionRepository {
  findById(id: string): Promise<Version | null>;
  findByScriptId(scriptId: string): Promise<Version[]>; // 按版本号降序
  findLatestVersion(scriptId: string): Promise<Version | null>;
  findByScriptIdAndNumber(
    scriptId: string,
    versionNumber: number,
  ): Promise<Version | null>;
  create(data: CreateVersionData): Promise<Version>;
  // 无 update / delete — 版本是只追加快照
}
```

### 关联查询

```ts
// 含场景列表
findByScriptIdWithScenes(scriptId: string) {
  return prisma.version.findMany({
    where: { scriptId },
    include: {
      scenes: {
        orderBy: { sceneNumber: "asc" },
        include: { dialogues: { orderBy: { sequence: "asc" } } }
      }
    },
    orderBy: { versionNumber: "desc" }
  })
}
```

### 关键方法

| 方法                      | Prisma 实现                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `findLatestVersion`       | `findFirst({ where:{scriptId}, orderBy:{versionNumber:"desc"} })`         |
| `findByScriptIdAndNumber` | `findUnique({ where:{scriptId_versionNumber:{scriptId,versionNumber}} })` |
| `getNextVersionNumber`    | `aggregate({ where:{scriptId}, _max:{versionNumber:true} })` + 1          |

### 索引依赖

- `@@unique([scriptId, versionNumber])` — 版本号唯一 + 快速查找

---

## 八、CharacterRepository

**职责**: `characters` 表访问

### CRUD

```ts
class CharacterRepository {
  findByScriptId(scriptId: string): Promise<Character[]>;
  createMany(data: CreateCharacterData[]): Promise<number>;
  deleteByScriptId(scriptId: string): Promise<number>;
  // AI 写入前先清旧数据，再批量写入
}
```

### 事务场景

```ts
// CharacterService.upsertCharacters 中:
await prisma.$transaction([
  prisma.character.deleteMany({ where: { scriptId } }),
  prisma.character.createMany({ data: characters }),
]);
```

### 索引依赖

- `@@index([scriptId])` — 按剧本查人物

---

## 九、SceneRepository

**职责**: `scenes` 表访问（依附于 Version 聚合）

### CRUD

```ts
class SceneRepository {
  findByVersionId(versionId: string): Promise<Scene[]>;
  createMany(data: CreateSceneData[]): Promise<number>;
  deleteByVersionId(versionId: string): Promise<number>;
}
```

### 关联查询

```ts
// 含对白
findByVersionIdWithDialogues(versionId: string) {
  return prisma.scene.findMany({
    where: { versionId },
    include: { dialogues: { orderBy: { sequence: "asc" } } },
    orderBy: { sceneNumber: "asc" }
  })
}
```

### 索引依赖

- `@@index([versionId, sceneNumber])` — 按版本 + 序号排序

---

## 十、DialogueRepository

**职责**: `dialogues` 表访问（依附于 Scene 聚合）

### CRUD

```ts
class DialogueRepository {
  findBySceneId(sceneId: string): Promise<Dialogue[]>;
  createMany(data: CreateDialogueData[]): Promise<number>;
  deleteBySceneId(sceneId: string): Promise<number>;
}
```

### 索引依赖

- `@@index([sceneId, sequence])` — 按场景 + 序号排序

---

## 十一、分页规范

统一使用以下接口，Repository 内部转换为 Prisma `skip`/`take`:

```ts
interface PaginationParams {
  page?: number; // 默认 1, min 1
  pageSize?: number; // 默认 20, max 100
}

interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

**Prisma 公式**:

```ts
const skip = (page - 1) * pageSize;
const take = pageSize;
// 并行查询
const [list, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take, orderBy }),
  prisma.model.count({ where }),
]);
```

---

## 十二、排序规范

| 表          | 默认排序             | 可选字段                     |
| ----------- | -------------------- | ---------------------------- |
| `novels`    | `createdAt desc`     | createdAt                    |
| `tasks`     | `createdAt desc`     | createdAt, updatedAt, status |
| `scripts`   | `updatedAt desc`     | createdAt, updatedAt, title  |
| `versions`  | `versionNumber desc` | versionNumber                |
| `scenes`    | `sceneNumber asc`    | sceneNumber                  |
| `dialogues` | `sequence asc`       | sequence                     |

```ts
function buildOrderBy(sortBy: string, sortOrder: string) {
  return { [sortBy]: sortOrder }; // Prisma 原生支持
}
```

---

## 十三、事务边界

| 操作                             | 事务位置   | 原因                                |
| -------------------------------- | ---------- | ----------------------------------- |
| Task 创建 + AgentResult 批量     | Service    | `prisma.$transaction([...])` 跨多表 |
| Script 更新 + Version 快照       | Service    | 原子性要求                          |
| Script 回滚 + 新 Version         | Service    | 跨 Script + Version 表              |
| Character upsert (delete+create) | Service    | 批量操作事务                        |
| Novel 导入 + MinIO 上传          | Service    | 补偿事务（上传失败回滚 DB）         |
| 单表 CRUD                        | Repository | 无需显式事务                        |

**Repository 职责**: 提供原子操作，不自行开启 `$transaction`。
**Service 职责**: 编排跨 Repository 的事务边界。

---

## 十四、Service → Repository 依赖关系

```
UserService
  └── UserRepository

NovelService
  └── NovelRepository

TaskService
  ├── TaskRepository
  └── AgentResultRepository

ScriptService
  ├── ScriptRepository
  └── VersionRepository

CharacterService
  └── CharacterRepository

PolishService
  └── ScriptRepository

ExportService
  ├── ScriptRepository
  └── VersionRepository

AIService
  ├── TaskRepository (更新进度)
  ├── AgentResultRepository (写结果)
  ├── CharacterRepository (写人物)
  ├── SceneRepository (写场景)
  └── DialogueRepository (写对白)
```

---

## 十五、查询优化汇总

| #   | 优化项                         | 依赖索引                              | 状态 |
| --- | ------------------------------ | ------------------------------------- | ---- |
| 1   | Novel 按用户分页               | `@@index([userId, createdAt])`        | ✅   |
| 2   | Task 按用户+状态筛选           | `@@index([userId, status])`           | ✅   |
| 3   | Task 队列调度查询              | `@@index([status, createdAt])`        | ✅   |
| 4   | Task 按 novelId 查唯一任务     | `novelId @unique`                     | ✅   |
| 5   | AgentResult 按 task+agent 唯一 | `@@unique([taskId, agentName])`       | ✅   |
| 6   | Script 按 novelId 查唯一剧本   | `novelId @unique`                     | ✅   |
| 7   | Script 软删除过滤              | `@@index([deletedAt])`                | ✅   |
| 8   | Version 按 script+版本号唯一   | `@@unique([scriptId, versionNumber])` | ✅   |
| 9   | Character 按 scriptId 查询     | `@@index([scriptId])`                 | ✅   |
| 10  | Scene 按版本+序号排序          | `@@index([versionId, sceneNumber])`   | ✅   |
| 11  | Dialogue 按场景+序号排序       | `@@index([sceneId, sequence])`        | ✅   |

---

## 十六、风险分析

| 编号     | 风险                                     | 等级      | 建议                                                                |
| -------- | ---------------------------------------- | --------- | ------------------------------------------------------------------- |
| RISK-001 | Script.findByUserId 无 userId 索引       | 🟡 Medium | Script 表目前无 userId 单独索引，大用户量时考虑 `@@index([userId])` |
| RISK-002 | N+1 查询：查 Script 列表后逐条查 Version | 🟡 Medium | `findByUserId` 不 include versions，按需单查详情                    |
| RISK-003 | Scene/Dialogue 批量写入可能触发大事务    | 🟢 Low    | AI 生成的场景数有限（单版本 < 200），createMany 可控                |
| RISK-004 | SQLite 单写锁在 createMany 时阻塞        | 🟢 Low    | WAL 模式缓解；并发限制（1 运行 + 3 排队）                           |
| RISK-005 | Version 表 `findLatestVersion` 全表扫描  | 🟢 Low    | `@@unique([scriptId, versionNumber])` 索引覆盖                      |

```

```
