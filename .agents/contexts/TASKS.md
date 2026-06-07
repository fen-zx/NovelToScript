# TASKS — 任务看板

> 最后更新: 2026-06-07

---

## 待开始 (Iter-2 ~ Iter-5)

### 前后端联调 (Iter-2)

- [ ] **T-049** A5 SSE Redis Pub/Sub 接入（后端占位 → 真实推送）
- [ ] **T-050** Auth 模块前后端联调（注册/登录/重置/查重）
- [ ] **T-051** Novel 导入模块前后端联调（上传 + 章节识别）
- [ ] **T-052** Task 模块前后端联调（创建/列表/详情/重试/删除）
- [ ] **T-053** Script 模块前后端联调（获取/更新/版本/回滚/导出）

### Agent 流水线 (Iter-3)

- [ ] **T-054** DeepSeek API 联调 — NovelAnalysisChain 端到端
- [ ] **T-055** DeepSeek API 联调 — CharacterExtractionChain
- [ ] **T-056** DeepSeek API 联调 — PlotAnalysisChain
- [ ] **T-057** DeepSeek API 联调 — ScenePlanningChain
- [ ] **T-058** DeepSeek API 联调 — ScriptGenerationChain
- [ ] **T-059** DeepSeek API 联调 — YamlValidationChain
- [ ] **T-060** DeepSeek API 联调 — FaithfulnessCheck
- [ ] **T-061** DeepSeek API 联调 — ScriptPolishChain
- [ ] **T-062** BullMQ Worker 端到端集成测试

### 剧本编辑器 (Iter-4)

- [ ] **T-063** Monaco Editor 集成（YAML 语法高亮 + Schema 提示）
- [ ] **T-064** 分屏编辑/预览完善
- [ ] **T-065** 剧本编辑子组件拆分（SceneCard / DialogueEditor / CharacterPanel）
- [ ] **T-066** YAML Schema 实时校验（编辑时即时反馈）

### 润色 + 导出 + 上线 (Iter-5)

- [ ] **T-067** 7 风格润色端到端测试
- [ ] **T-068** 多格式导出完善（yaml/json/md/txt/pdf）
- [ ] **T-069** PDF 导出 Puppeteer 渲染
- [ ] **T-070** 定时清理 Worker 验证（30 天生命周期）
- [ ] **T-071** 性能优化（缓存策略 + DB 查询优化）
- [ ] **T-072** 部署上线 + 运维文档

---

## 进行中

_暂无_

---

## 已完成 (Iter-1: 脚手架 + 全栈代码生成)

### 文档设计

- [x] **T-048** YAML Schema 定义文档 + 设计原因（`docs/core/YAML_SCHEMA.md`）
- [x] PRD 需求文档（14 问确认）
- [x] 系统设计 + 架构决策（14 条 ADR）
- [x] 页面规格 + API 规格（16 接口）
- [x] 后端架构 + Service/Repository 层设计
- [x] 数据库设计（9 表）+ Prisma Schema（2 次迁移）
- [x] 队列架构（4 队列 + 4 Worker）
- [x] AI 工作流（8 Agent + 三温策略 + 忠实度校验）
- [x] 前端架构 + 组件方案（43 组件）+ 实现蓝图

### 脚手架

- [x] **T-001** 初始化 Vue 3 + TypeScript 前端项目
- [x] **T-002** 初始化 Express + TypeScript 后端项目
- [x] **T-003** 配置 ESLint + Prettier
- [x] **T-004** 初始化 Prisma 数据模型

### 前端页面

- [x] **T-005** P0 登录注册页（AuthPage.vue）
- [x] **T-006** P1 项目首页（HomePage.vue）
- [x] **T-007** P2 小说导入页（ImportPage.vue）
- [x] **T-008** P3 分析任务页（TaskListPage.vue）
- [x] **T-009** P4 任务详情页（TaskDetailPage.vue，含 SSE）
- [x] **T-010** P5 剧本编辑页（ScriptEditorPage.vue）
- [x] **T-010b** P6 YAML Schema 文档页（SchemaPage.vue）

### 后端接口

- [x] **T-011** A0a POST /api/auth/register
- [x] **T-012** A0b POST /api/auth/login
- [x] **T-013** A0c POST /api/auth/reset-password
- [x] **T-013b** A0d GET /api/auth/check-account
- [x] **T-014** A1 POST /api/novels/import
- [x] **T-015** A2 POST /api/tasks
- [x] **T-016** A3 GET /api/tasks
- [x] **T-017** A4 GET /api/tasks/:id
- [x] **T-018** A5 SSE /api/tasks/:id/stream（后端占位，待 Redis Pub/Sub 接入）
- [x] **T-019** A10 POST /api/tasks/:id/retry
- [x] **T-020** A6 GET /api/scripts/:id
- [x] **T-021** A7 PUT /api/scripts/:id
- [x] **T-022** A11 GET /api/scripts/:id/versions
- [x] **T-023** A12 GET /api/scripts/:id/versions/:v
- [x] **T-024** A13 POST /api/scripts/:id/rollback
- [x] **T-025** A8 POST /api/scripts/:id/polish
- [x] **T-026** A14 GET /api/scripts/:id/export
- [x] **T-027** A9 GET /api/schema

### 后端基础设施

- [x] **T-028** Prisma Schema 定义 + 迁移（2 次）
- [x] **T-029** Redis 连接管理 + 缓存中间件
- [x] **T-030** BullMQ 队列管理（4 队列）
- [x] **T-031** MinIO 存储服务（上传/下载/生命周期）
- [x] **T-032** JWT 认证中间件
- [x] **T-033** 文件上传安全校验
- [x] **T-034** 速率限制中间件
- [x] **T-035** 全局错误处理中间件（AppError + ZodError）
- [x] **T-036** Puppeteer PDF 渲染服务
- [x] **T-037** 章节识别引擎（五级兜底策略）
- [x] **T-038** 三级文本分片器（章节→段落→语义）
- [x] **T-039** YAML Schema 校验器（本地 + AI 双校验）
- [x] **T-040** Docker Compose 部署配置（生产 + 开发模式）

### AI Agent（代码已生成，待 API 联调）

- [x] **T-041** Novel Analysis Agent（`chains/novel-analysis.chain.ts`）
- [x] **T-042** Character Extraction Agent（`chains/character-extraction.chain.ts`）
- [x] **T-043** Plot Extraction Agent（`chains/plot-analysis.chain.ts`）
- [x] **T-044** Scene Planning Agent（`chains/scene-planning.chain.ts`）
- [x] **T-045** Script Generation Agent（`chains/script-generation.chain.ts`）
- [x] **T-046** YAML Validation Agent（`chains/yaml-validation.chain.ts`）
- [x] **T-047** Script Polish Agent（`chains/polish.chain.ts`）

### 安全性

- [x] 从 Git 仓库移除 `backend/.env.docker`，`.gitignore` 已覆盖
