# Database Schema — AI小说转剧本工具

> 基于 ARCHITECTURE.md 领域模型 + PRD 实体分析重新生成
> 数据库: SQLite | ORM: Prisma 5.x | 日期: 2026-06-05

---

## 一、实体分析

### User

**职责**: 系统用户，管理认证信息与存储配额

| 字段         | 类型          | 必填 | 说明                     |
| ------------ | ------------- | ---- | ------------------------ |
| id           | String (cuid) | ✅   | 主键                     |
| username     | String        | ✅   | 用户名 (2-20字)          |
| account      | String        | ✅   | 登录账号 (唯一)          |
| passwordHash | String        | ✅   | bcrypt 哈希              |
| storageUsed  | Int           | ✅   | 已用存储 (bytes), 默认 0 |
| createdAt    | DateTime      | ✅   | 注册时间                 |
| updatedAt    | DateTime      | ✅   | 更新时间                 |

### Novel

**职责**: 小说原文元数据（原文内容存 MinIO，不存 DB）

| 字段         | 类型          | 必填 | 说明                   |
| ------------ | ------------- | ---- | ---------------------- |
| id           | String (cuid) | ✅   | 主键                   |
| userId       | String        | ✅   | 所属用户 FK            |
| title        | String        | ✅   | 书名                   |
| author       | String?       |      | 作者 (选填)            |
| chapterCount | Int           | ✅   | 章节数 (3~100)         |
| wordCount    | Int           | ✅   | 总字数                 |
| fileFormat   | FileFormat    | ✅   | 文件格式 (TXT/DOCX/MD) |
| filePath     | String?       |      | MinIO 存储路径         |
| createdAt    | DateTime      | ✅   | 导入时间               |

> **架构决策**: `rawText` 不存入 DB，原文经 Multer 上传后直接写入 MinIO（`novels/{userId}/{novelId}/original.{ext}`），DB 仅存 `filePath` 元数据。

### Task

**职责**: AI 分析任务，跟踪 7 Agent 流水线状态

| 字段            | 类型          | 必填 | 说明               |
| --------------- | ------------- | ---- | ------------------ |
| id              | String (cuid) | ✅   | 主键               |
| novelId         | String        | ✅   | 关联小说 FK        |
| userId          | String        | ✅   | 所属用户 FK        |
| status          | TaskStatus    | ✅   | 默认 queued        |
| progress        | Float         | ✅   | 进度 0.0~1.0       |
| currentAgent    | String?       |      | 当前执行 Agent 名  |
| resumeFromAgent | String?       |      | 断点重试起始 Agent |
| retryMode       | String?       |      | resume / restart   |
| errorMessage    | String?       |      | 失败原因           |
| startedAt       | DateTime?     |      | 开始执行时间       |
| completedAt     | DateTime?     |      | 完成时间           |
| createdAt       | DateTime      | ✅   | 创建时间           |
| updatedAt       | DateTime      | ✅   | 更新时间           |

### AgentResult

**职责**: 单个 Agent 的执行结果

| 字段         | 类型          | 必填 | 说明          |
| ------------ | ------------- | ---- | ------------- |
| id           | String (cuid) | ✅   | 主键          |
| taskId       | String        | ✅   | 关联任务 FK   |
| agentName    | String        | ✅   | Agent 名称    |
| status       | AgentStatus   | ✅   | 默认 pending  |
| output       | String?       |      | JSON 格式输出 |
| errorMessage | String?       |      | 错误信息      |
| startedAt    | DateTime?     |      | 开始时间      |
| completedAt  | DateTime?     |      | 完成时间      |
| createdAt    | DateTime      | ✅   | 创建时间      |

### Script

**职责**: 剧本主表，关联用户和小说（YAML 内容存 Version 表）

| 字段           | 类型          | 必填 | 说明               |
| -------------- | ------------- | ---- | ------------------ |
| id             | String (cuid) | ✅   | 主键               |
| userId         | String        | ✅   | 所属用户 FK        |
| novelId        | String        | ✅   | 来源小说 FK (唯一) |
| title          | String        | ✅   | 剧本标题           |
| currentVersion | Int           | ✅   | 当前版本号, 默认 1 |
| createdAt      | DateTime      | ✅   | 创建时间           |
| updatedAt      | DateTime      | ✅   | 更新时间           |
| deletedAt      | DateTime?     |      | 软删除标记         |

> **架构决策**: `content` 不存 Script 表。剧本 YAML 内容按版本快照存储在 Version 表，`currentVersion` 指向最新版本号。

### Version

**职责**: 剧本版本快照，每次保存创建新版本

| 字段          | 类型          | 必填 | 说明          |
| ------------- | ------------- | ---- | ------------- |
| id            | String (cuid) | ✅   | 主键          |
| scriptId      | String        | ✅   | 关联剧本 FK   |
| versionNumber | Int           | ✅   | 版本号 (自增) |
| content       | String        | ✅   | YAML 剧本内容 |
| note          | String?       |      | 版本备注      |
| createdAt     | DateTime      | ✅   | 创建时间      |

### Character

**职责**: 剧本人物

| 字段        | 类型          | 必填 | 说明               |
| ----------- | ------------- | ---- | ------------------ |
| id          | String (cuid) | ✅   | 主键               |
| scriptId    | String        | ✅   | 关联剧本 FK        |
| name        | String        | ✅   | 人物名称           |
| role        | CharacterRole | ✅   | 角色类型           |
| description | String?       |      | 人物描述           |
| traits      | String?       |      | JSON: 性格特征数组 |
| createdAt   | DateTime      | ✅   | 创建时间           |

### Scene

**职责**: 剧本场景（依附于版本）

| 字段         | 类型          | 必填 | 说明                 |
| ------------ | ------------- | ---- | -------------------- |
| id           | String (cuid) | ✅   | 主键                 |
| versionId    | String        | ✅   | 关联版本 FK          |
| sceneNumber  | Int           | ✅   | 场景序号             |
| location     | String        | ✅   | 场景地点             |
| time         | String?       |      | 场景时间             |
| participants | String?       |      | JSON: 参与者 ID 数组 |
| createdAt    | DateTime      | ✅   | 创建时间             |

### Dialogue

**职责**: 场景对白

| 字段      | 类型          | 必填 | 说明        |
| --------- | ------------- | ---- | ----------- |
| id        | String (cuid) | ✅   | 主键        |
| sceneId   | String        | ✅   | 关联场景 FK |
| speaker   | String        | ✅   | 说话人      |
| text      | String        | ✅   | 对白文本    |
| sequence  | Int           | ✅   | 对白序号    |
| createdAt | DateTime      | ✅   | 创建时间    |

---

## 二、ER 模型

```
User ──────── 1:N ──────── Novel
  │                           │
  │ 1:N                       │ 1:1
  │                           │
  └────── Script ─────────────┘
            │
            │ 1:N
            │
         Version ──── 1:N ──── Scene
            │                      │
            │                      │ 1:N
            │                      │
            │                   Dialogue
            │
            │ N:N (via scriptId)
            │
         Character

User ──────── 1:N ──────── Task
                              │
                              │ 1:N
                              │
                          AgentResult
```

---

## 三、实体关系

| 关系               | 类型 | 说明                       |
| ------------------ | ---- | -------------------------- |
| User → Novel       | 1:N  | 一个用户可导入多部小说     |
| User → Script      | 1:N  | 一个用户可拥有多个剧本     |
| User → Task        | 1:N  | 一个用户可创建多个任务     |
| Novel → Script     | 1:1  | 一部小说对应一个剧本       |
| Novel → Task       | 1:1  | 一部小说对应一个分析任务   |
| Script → Version   | 1:N  | 一个剧本有多个版本快照     |
| Script → Character | 1:N  | 一个剧本有多个角色         |
| Task → AgentResult | 1:N  | 一个任务有 7 个 Agent 结果 |
| Version → Scene    | 1:N  | 一个版本有多个场景         |
| Scene → Dialogue   | 1:N  | 一个场景有多段对白         |

---

## 四、Prisma Schema

详见 `prisma/schema.prisma`

---

## 五、枚举设计

| 枚举              | 值                                            | 用途               |
| ----------------- | --------------------------------------------- | ------------------ |
| **TaskStatus**    | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` | Task.status        |
| **AgentStatus**   | `PENDING`, `RUNNING`, `DONE`, `FAILED`        | AgentResult.status |
| **CharacterRole** | `PROTAGONIST`, `ANTAGONIST`, `SUPPORTING`     | Character.role     |
| **FileFormat**    | `TXT`, `DOCX`, `MD`                           | Novel.fileFormat   |

---

## 六、索引设计

| 表              | 索引字段                | 类型       | 原因                |
| --------------- | ----------------------- | ---------- | ------------------- |
| `users`         | account                 | `@@unique` | 登录查询，账号唯一  |
| `novels`        | userId, createdAt       | `@@index`  | 按用户查询小说列表  |
| `tasks`         | userId, status          | `@@index`  | 任务列表 + 状态筛选 |
| `tasks`         | status, createdAt       | `@@index`  | 队列调度查询        |
| `scripts`       | novelId                 | `@unique`  | 小说唯一剧本 (1:1)  |
| `scripts`       | deletedAt               | `@@index`  | 软删除过滤          |
| `versions`      | scriptId, versionNumber | `@@unique` | 版本号在剧本内唯一  |
| `agent_results` | taskId, agentName       | `@@unique` | 同一任务+Agent 唯一 |
| `characters`    | scriptId                | `@@index`  | 按剧本查询人物      |
| `scenes`        | versionId, sceneNumber  | `@@index`  | 按版本+序号查询     |
| `dialogues`     | sceneId, sequence       | `@@index`  | 按场景+序号排序     |

---

## 七、唯一约束

| 约束                                  | 字段                      | 原因                            |
| ------------------------------------- | ------------------------- | ------------------------------- |
| `users_account_key`                   | account                   | 账号不可重复                    |
| `scripts_novelId_key`                 | novelId                   | 一部小说只有一个剧本 (1:1)      |
| `versions_scriptId_versionNumber_key` | (scriptId, versionNumber) | 版本号在剧本内唯一              |
| `agent_results_taskId_agentName_key`  | (taskId, agentName)       | 同一任务同一 Agent 只有一条结果 |

---

## 八、外键设计

| 子表        | 字段      | 父表    | 父字段 | 删除规则 | 原因                     |
| ----------- | --------- | ------- | ------ | -------- | ------------------------ |
| Novel       | userId    | User    | id     | Cascade  | 删用户→删所有小说        |
| Task        | userId    | User    | id     | Cascade  | 删用户→删所有任务        |
| Task        | novelId   | Novel   | id     | Cascade  | 删小说→删关联任务        |
| AgentResult | taskId    | Task    | id     | Cascade  | 删任务→删所有 Agent 结果 |
| Script      | userId    | User    | id     | Cascade  | 删用户→删所有剧本        |
| Script      | novelId   | Novel   | id     | Restrict | 小说有剧本时不可删除小说 |
| Version     | scriptId  | Script  | id     | Cascade  | 删剧本→删所有版本        |
| Character   | scriptId  | Script  | id     | Cascade  | 删剧本→删所有人物        |
| Scene       | versionId | Version | id     | Cascade  | 删版本→删所有场景        |
| Dialogue    | sceneId   | Scene   | id     | Cascade  | 删场景→删所有对白        |

> **Script.novelId 用 Restrict 而非 Cascade**: 防止误删小说导致已生成的剧本丢失（剧本有独立价值，支持软删除恢复）。

---

## 九、审计字段

| 表            | createdAt | updatedAt | deletedAt   |
| ------------- | --------- | --------- | ----------- |
| users         | ✅        | ✅        | —           |
| novels        | ✅        | —         | —           |
| tasks         | ✅        | ✅        | —           |
| agent_results | ✅        | —         | —           |
| scripts       | ✅        | ✅        | ✅ (软删除) |
| versions      | ✅        | —         | —           |
| characters    | ✅        | —         | —           |
| scenes        | ✅        | —         | —           |
| dialogues     | ✅        | —         | —           |

> `updatedAt` 仅主表（User/Task/Script）启用。快照类表（Version/Scene/Dialogue）只追加不更新，无 `updatedAt`。

---

## 十、软删除策略

| 表         | 软删除    | 字段      | 原因                                 |
| ---------- | --------- | --------- | ------------------------------------ |
| **Script** | ✅ 启用   | deletedAt | 剧本支持版本回滚，误删可恢复         |
| 其他表     | ❌ 不启用 | —         | 删除级联由 FK 保证；数据允许物理删除 |

---

## 十一、SQLite 兼容性检查

**状态**: ✅ 通过

| 检查项    | 结果    | 说明                                                            |
| --------- | ------- | --------------------------------------------------------------- |
| JSON 字段 | ✅ 兼容 | `traits`, `output`, `participants` 使用 `String` 存储 JSON 文本 |
| 数组字段  | ✅ 兼容 | 无原生数组字段，全部 JSON 文本替代                              |
| 枚举字段  | ✅ 兼容 | SQLite 不支持原生 enum，Prisma 用 String 映射                   |
| Decimal   | ✅ 兼容 | 无需 Decimal，只有 Int/Float                                    |
| 全文搜索  | ⚠️ 注意 | 小说原文存 MinIO，不依赖 SQLite FTS                             |
| 并发写入  | ⚠️ 注意 | SQLite 单写锁，建议开启 WAL 模式                                |

---

## 十二、Migration 计划

### 迁移顺序

| 序号 | Migration                | 内容                              | 命令                                                   |
| ---- | ------------------------ | --------------------------------- | ------------------------------------------------------ |
| 001  | `init_users`             | User 表                           | `npx prisma migrate dev --name init_users`             |
| 002  | `add_novels`             | Novel 表 + FileFormat 枚举        | `npx prisma migrate dev --name add_novels`             |
| 003  | `add_tasks`              | Task 表 + TaskStatus 枚举         | `npx prisma migrate dev --name add_tasks`              |
| 004  | `add_agent_results`      | AgentResult 表 + AgentStatus 枚举 | `npx prisma migrate dev --name add_agent_results`      |
| 005  | `add_scripts`            | Script 表 + CharacterRole 枚举    | `npx prisma migrate dev --name add_scripts`            |
| 006  | `add_versions`           | Version 表                        | `npx prisma migrate dev --name add_versions`           |
| 007  | `add_characters`         | Character 表                      | `npx prisma migrate dev --name add_characters`         |
| 008  | `add_scenes_dialogues`   | Scene + Dialogue 表               | `npx prisma migrate dev --name add_scenes_dialogues`   |
| 009  | `add_script_soft_delete` | Script 增加 deletedAt             | `npx prisma migrate dev --name add_script_soft_delete` |

### 精简建议

可合并为 4 次 migration：

```bash
npx prisma migrate dev --name init_core      # User + Novel + Script + Character
npx prisma migrate dev --name init_tasks     # Task + AgentResult
npx prisma migrate dev --name init_versions  # Version + Scene + Dialogue
npx prisma migrate dev --name add_soft_delete # Script.deletedAt
```

---

## 十三、性能优化建议

| #   | 发现                                         | 建议                                  | 优先级 |
| --- | -------------------------------------------- | ------------------------------------- | ------ |
| 1   | Task 列表常按 status + createdAt 联合查询    | `@@index([status, createdAt])`        | High   |
| 2   | Version 查询 scriptId + versionNumber 是热点 | `@@unique([scriptId, versionNumber])` | High   |
| 3   | Script 软删除后查询需过滤 deletedAt          | `@@index([deletedAt])`                | Medium |
| 4   | Scene 查询按 versionId + sceneNumber 排序    | `@@index([versionId, sceneNumber])`   | Medium |
| 5   | Character 按剧本查询是热点                   | `@@index([scriptId])` ✅ 已设置       | Medium |
| 6   | SQLite 单写锁可能成为瓶颈                    | 开启 `PRAGMA journal_mode=WAL`        | Medium |
| 7   | 长文本 content 字段可能导致行溢出            | 大剧本 content 存 MinIO（当前已规避） | Low    |

---

## 十四、风险分析

| 编号     | 风险                                        | 等级      | 建议                                                       |
| -------- | ------------------------------------------- | --------- | ---------------------------------------------------------- |
| RISK-001 | Script.content 字段过大（YAML 可能 >100KB） | 🟡 Medium | 大剧本 content 存 MinIO，DB 仅存元数据                     |
| RISK-002 | SQLite 并发写入瓶颈（多任务同时 AI 生成）   | 🟡 Medium | 当前并发限制 1 运行 + 3 排队，可控；未来迁移 PostgreSQL    |
| RISK-003 | Version 表无限增长（每次保存创建新版本）    | 🟢 Low    | 单剧本预计 <100 版本，SQLite 单表可达 TB 级                |
| RISK-004 | 软删除 Script 后关联 Version 查询遗漏       | 🟢 Low    | 查询时统一加 `WHERE deletedAt IS NULL`，封装 Repository 层 |
| RISK-005 | Novel.onDelete: Cascade 误删关联剧本        | 🟢 Low    | Script.novelId 使用 `onDelete: Restrict`，阻止级联删除     |
| RISK-006 | 缺少 Character 按 scriptId 查询的索引       | 🟢 Low    | `@@index([scriptId])` 已补充，查询按剧本过滤人物时走索引   |
