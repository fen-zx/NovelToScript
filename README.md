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
├── docs/
│   ├── core/                   # 核心设计文档 (11份)
│   │   ├── PRD.md              # 产品需求
│   │   ├── ARCHITECTURE.md     # 后端架构
│   │   ├── DATABASE_SCHEMA.md  # 数据库设计
│   │   ├── API_SPECS.md        # 16 接口规格
│   │   ├── AI_WORKFLOW.md      # AI 工作流
│   │   ├── YAML_SCHEMA.md      # 剧本 YAML Schema
│   │   ├── DEPLOYMENT.md       # 部署运维指南
│   │   └── ...
│   └── temp/                   # 中间产物 (6份)
├── .agents/                    # Agent 技能 + 项目管理
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

### 方式一：Docker Compose 一键启动（推荐）

```bash
# 1. 配置 DeepSeek API Key
#    编辑 backend/.env.docker，填入 DEEPSEEK_API_KEY

# 2. 构建并启动所有服务（Redis + MinIO + Backend）
docker compose up -d --build

# 3. 启动前端
cd frontend
npm install
npm run dev
```

服务启动后：

| 服务          | 地址                  |
| ------------- | --------------------- |
| 前端          | http://localhost:5173 |
| API           | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |

```
# 查看日志
docker compose logs -f backend

# 停止所有服务
docker compose down
```

### 方式二：手动启动

#### 1. 环境要求

| 依赖         | 版本             | 用途                             | 必须            |
| ------------ | ---------------- | -------------------------------- | --------------- |
| Node.js      | ≥ 20             | 运行时                           | ✅              |
| Redis        | ≥ 6.2 (最低 5.0) | BullMQ 任务队列 + SSE 推送       | ✅              |
| MinIO        | latest           | 文件存储（小说原文、剧本、导出） | ✅              |
| DeepSeek API | —                | AI 剧本生成                      | ⚠️ 开发时可不填 |

#### 2. 启动基础设施

```bash
# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# MinIO (API:9000, Console:9001, 账号: minioadmin / minioadmin)
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

#### 3. 后端启动

```bash
cd backend
npm install
# 编辑 .env，填入 DEEPSEEK_API_KEY
npm run db:migrate
npm run dev          # API 服务器 (端口 3000)
npm run worker       # 另开终端，启动 Worker
```

#### 4. 前端启动

```bash
cd frontend
npm install
npm run dev          # 开发服务器 (端口 5173)
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

完整设计文档见 [`docs/core/`](docs/core/)：

| 文档               | 内容                        |
| ------------------ | --------------------------- |
| PRD.md             | 产品需求 + 业务流程图       |
| ARCHITECTURE.md    | 后端架构 (18章节)           |
| DATABASE_SCHEMA.md | 数据库设计 (9表)            |
| API_SPECS.md       | 16 接口完整规格             |
| AI_WORKFLOW.md     | LangChain + DeepSeek 工作流 |
| YAML_SCHEMA.md     | 剧本 YAML 结构规范          |
| DEPLOYMENT.md      | 部署与运维指南              |

## License

MIT
