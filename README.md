# NovelToScript — AI 小说转剧本工具

> 一款 AI 辅助剧本创作工具，将小说自动转换为结构化 YAML 格式剧本。

## 项目架构

```
NovelToScript/
├── frontend/                    # Vue 3 前端 (Element Plus + Pinia)
│   └── src/
│       ├── views/               # 7 页面 (P0~P6)
│       ├── components/          # 7 全局组件
│       ├── api/                 # 7 API 模块 (Axios + JWT + SSE)
│       ├── stores/              # 3 Pinia Store (auth/notification/theme)
│       ├── hooks/               # useSSE + useCache
│       └── router/              # Vue Router + AuthGuard
│
├── backend/                     # Express 后端 (TypeScript + Prisma)
│   └── src/
│       ├── modules/
│       │   ├── auth/            # 用户认证 (JWT + bcrypt)
│       │   ├── novel/           # 小说导入 (Multer + MinIO)
│       │   ├── task/            # 任务管理 (BullMQ + SSE)
│       │   ├── script/          # 剧本编辑 (版本 + 回滚 + 导出)
│       │   └── ai/              # AI 流水线 (LangChain + DeepSeek)
│       ├── queue/workers/       # 4 BullMQ Worker
│       ├── config/              # 环境配置
│       ├── shared/              # Prisma + Redis + MinIO + 队列
│       ├── middleware/          # JWT + 错误 + 校验
│       └── utils/               # 章节识别 + YAML校验 + 日志
│
├── docs/prem/                   # 设计文档 (15份)
│   ├── PRD.md                   # 产品需求
│   ├── ARCHITECTURE.md          # 后端架构
│   ├── DATABASE_SCHEMA.md       # 数据库设计
│   ├── API_SPECS.md             # 16 接口规格
│   ├── SERVICE_SPECS.md         # Service 层设计
│   ├── REPOSITORY_SPECS.md      # Repository 层设计
│   ├── QUEUE_SPECS.md           # BullMQ 队列架构
│   ├── AI_WORKFLOW.md           # AI 工作流
│   └── ...
├── prototype/                   # HTML 交互原型
└── README.md                    # 本文件
```

## 技术栈

| 层         | 技术                                                           |
| ---------- | -------------------------------------------------------------- |
| **前端**   | Vue 3 + TypeScript + Element Plus + Pinia + Vue Router + Axios |
| **后端**   | Node.js + Express + TypeScript                                 |
| **数据库** | SQLite + Prisma 7                                              |
| **队列**   | BullMQ + Redis                                                 |
| **存储**   | MinIO (S3-compatible)                                          |
| **AI**     | LangChain.js + DeepSeek v2                                     |
| **校验**   | Zod                                                            |
| **日志**   | Pino                                                           |

## 快速开始

### 1. 环境要求

| 依赖         | 版本             | 用途                             | 必须            |
| ------------ | ---------------- | -------------------------------- | --------------- |
| Node.js      | ≥ 20             | 运行时                           | ✅              |
| Redis        | ≥ 6.2 (最低 5.0) | BullMQ 任务队列 + SSE 推送       | ✅              |
| MinIO        | latest           | 文件存储（小说原文、剧本、导出） | ✅              |
| DeepSeek API | —                | AI 剧本生成                      | ⚠️ 开发时可不填 |

### 2. 启动基础设施（Redis + MinIO）

**后端启动前，必须先启动 Redis 和 MinIO。**

#### Windows（原生）

```powershell
# ─── Redis ───
# 下载 Redis for Windows: https://github.com/tporadowski/redis/releases
# 解压后运行:
redis-server.exe

# ─── MinIO ───
# 下载
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "$env:USERPROFILE\minio.exe"
# 启动 (API:9000, Console:9001, 账号: minioadmin / minioadmin)
& "$env:USERPROFILE\minio.exe" server "$env:USERPROFILE\minio-data" --console-address ":9001"
```

#### 使用 Docker（推荐）

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 3. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量 (编辑 .env)
# 必填: DEEPSEEK_API_KEY=sk-xxx

# 数据库迁移
npm run db:migrate

# 启动 API 服务器 (端口 3000)
npm run dev

# 另开终端，启动 Worker
npm run worker
```

### 4. 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

### 5. 访问

| 服务          | 地址                                |
| ------------- | ----------------------------------- |
| 前端          | http://localhost:5173               |
| API 健康检查  | http://localhost:3000/api/health    |
| MinIO Console | http://localhost:9001               |
| Prisma Studio | `npm run db:studio`（backend 目录） |

### 6. 启动顺序总结

```
1. Redis     (端口 6379)  ← 必须先启动
2. MinIO     (端口 9000)  ← 必须先启动
3. 后端 API  (端口 3000)  ← npm run dev
4. 后端 Worker           ← npm run worker (可选，AI功能需要)
5. 前端      (端口 5173)  ← npm run dev
```

## 核心流程

```
用户注册登录 → 导入小说(txt/docx/md) → 创建分析任务 → BullMQ 入队
                                                          ↓
                                           7 Agent AI 流水线 (SSE 实时进度)
                                                          ↓
                                           剧本生成完成 → 编辑/润色/导出/回滚
```

## API 概览 (16 接口)

| 模块   | 接口 | 用途                             |
| ------ | ---- | -------------------------------- |
| Auth   | 4    | 注册/登录/密码重置/账号查重      |
| Novel  | 1    | 小说导入                         |
| Task   | 5    | 创建/列表/详情/SSE进度/重试/删除 |
| Script | 5    | 获取/编辑/润色/版本/回滚/导出    |
| Schema | 1    | YAML Schema 文档                 |

## 设计文档

完整设计文档见 [`docs/prem/`](docs/prem/)：

| 文档               | 内容                        |
| ------------------ | --------------------------- |
| PRD.md             | 产品需求 + 业务流程图       |
| ARCHITECTURE.md    | 后端架构 (18章节)           |
| DATABASE_SCHEMA.md | 数据库设计 (9表)            |
| API_SPECS.md       | 16 接口完整规格             |
| AI_WORKFLOW.md     | LangChain + DeepSeek 工作流 |

## License

MIT
