# TASKS — 任务看板

> 最后更新: 2026-06-05

---

## 待开始

### 脚手架

- [ ] **T-001** 初始化 Vue 3 + TypeScript 前端项目
- [ ] **T-002** 初始化 Express + TypeScript 后端项目
- [ ] **T-003** 配置 ESLint + Prettier
- [ ] **T-004** 初始化 Prisma 数据模型

### 前端页面

- [ ] **T-005** P1 项目首页
- [ ] **T-006** P2 小说导入页
- [ ] **T-007** P3 分析任务页
- [ ] **T-008** P4 任务详情页（含 SSE 进度）
- [ ] **T-009** P5 剧本编辑页（Monaco Editor + Markdown 预览）
- [ ] **T-010** P6 YAML Schema 文档页

### 后端接口

- [ ] **T-011** A0a POST /api/auth/register
- [ ] **T-012** A0b POST /api/auth/login
- [ ] **T-013** A0c POST /api/auth/reset-password
- [ ] **T-014** A1 POST /api/novels/import
- [ ] **T-015** A2 POST /api/tasks
- [ ] **T-016** A3 GET /api/tasks
- [ ] **T-017** A4 GET /api/tasks/:id
- [ ] **T-018** A5 SSE /api/tasks/:id/stream
- [ ] **T-019** A10 POST /api/tasks/:id/retry
- [ ] **T-020** A6 GET /api/scripts/:id
- [ ] **T-021** A7 PUT /api/scripts/:id
- [ ] **T-022** A11 GET /api/scripts/:id/versions
- [ ] **T-023** A12 GET /api/scripts/:id/versions/:v
- [ ] **T-024** A13 POST /api/scripts/:id/rollback
- [ ] **T-025** A8 POST /api/scripts/:id/polish
- [ ] **T-026** A14 GET /api/scripts/:id/export
- [ ] **T-027** A9 GET /api/schema

### 后端基础设施

- [ ] **T-028** Prisma Schema 定义 + 迁移
- [ ] **T-029** Redis 连接管理 + 缓存中间件
- [ ] **T-030** BullMQ 队列管理（script-generation/polish/export-pdf/cleanup）
- [ ] **T-031** MinIO 存储服务（上传/下载/生命周期）
- [ ] **T-032** JWT 认证中间件 + RBAC 权限
- [ ] **T-033** 文件上传安全校验（格式白名单+MIME+大小）
- [ ] **T-034** 速率限制中间件
- [ ] **T-035** 全局错误处理中间件
- [ ] **T-036** Puppeteer PDF 渲染服务
- [ ] **T-037** 章节识别引擎（五级兜底策略）
- [ ] **T-038** 三级文本分片器
- [ ] **T-039** YAML Schema 校验器
- [ ] **T-040** Docker Compose 部署配置

### AI Agent

- [ ] **T-041** Novel Analysis Agent
- [ ] **T-042** Character Extraction Agent
- [ ] **T-043** Plot Extraction Agent
- [ ] **T-044** Scene Planning Agent
- [ ] **T-045** Script Generation Agent
- [ ] **T-046** YAML Validation Agent
- [ ] **T-047** Script Polish Agent
- [ ] **T-048** YAML Schema 定义文档 + extensions 扩展

---

## 进行中

_暂无_

---

## 已完成

_暂无_
