# CHANGELOG — 变更记录

## 2026-06-07

### 🤖 Agent 流水线重构 — Iter-3 完成

- **AI Service 重构**: JSON解析增加最多2次重试、统一使用 OutputParser、mergeAnalysis 字段对齐 NovelAnalysis prompt 输出格式（genre/subGenre/themes/narrativeStyle/toneStyle/events）
- **Token 安全**: 各步骤输入截断（characters≤3K、plotAnalysis≤4K、yaml≤12K），防止超限
- **Worker 修复**: 进度计算分母 8→7；errorMessage 类型断言修复 TS 编译
- **影响**: backend/src/modules/ai/ai.service.ts, backend/src/queue/workers/generate-script.worker.ts
- **级别**: minor

### 📝 Monaco Editor 集成 — Iter-4 完成

- **新增**: `frontend/src/components/YamlEditor.vue` — Monaco Editor 封装（YAML语法高亮、暗色主题、自动布局、v-model双向绑定）
- **ScriptEditorPage**: `<el-input textarea>` → `<YamlEditor>`；自动保存延迟 30s→2s；保存去重（lastSavedContent 比对）
- **导出实现**: ExportService 后端5格式（yaml/json/md/txt同步 + pdf异步）；前端优先调API、失败降级客户端Blob
- **影响**: frontend: 3 files (1 new) | backend: script.controller.ts
- **级别**: minor

### � 前后端联调 — Iter-2 完成

- **SSE Redis Pub/Sub**: 新增 `backend/src/shared/queue/sse-pubsub.ts`，Worker 进程通过 Redis 发布 Agent 事件，SSE Handler 订阅并转发给前端 EventSource，替代原有占位实现
- **Auth 联调**: DTO/响应格式对齐；user 信息持久化 localStorage，页面刷新不丢失登录态
- **Novel 导入联调**: 移除手动的 `Content-Type: multipart/form-data`（axios 自动 boundary）；添加 `validate(ImportNovelBody)` Zod 校验
- **Script 联调**: `getScriptById` 补充 `novelTitle`/`novelAuthor` 字段，版本列表/回滚响应与前端类型对齐
- **Task 联调**: 分页 `list/total/page/pageSize` 格式验证通过
- **影响**: backend: 5 files (+1 new) | frontend: 3 files
- **级别**: minor

### �📄 YAML Schema 文档 — 剧本结构规范定义

- **内容**: 新增 `docs/core/YAML_SCHEMA.md`，完整定义剧本 YAML 结构规范
- **涵盖**: 4 顶级字段 (title/metadata/characters/scenes)、12 emotion 枚举、9 mood 枚举、13 genre 枚举、4 role 枚举
- **校验规则**: 21 条结构/元数据/角色/场景/对白校验规则，分级 error/warning
- **设计原因**: 详述 YAML 选型、三层结构、场景为核心单元、action/emotion 字段、stageDirections 数组、characters 前置、枚举值定量的设计理由
- **扩展性**: SemVer 版本策略、预留扩展点、数据库映射
- **影响**: docs/core/YAML_SCHEMA.md (新增)
- **级别**: minor

### 📁 文档结构重组

- **内容**: `docs/prem/` → `docs/core/`（核心设计 10 文档）+ `docs/temp/`（中间产物 6 文档）；CHANGELOG/DECISIONS 归入 `.agents/project/`；PROJECT_STATE/TASKS 归入 `.agents/contexts/`
- **影响**: docs/prem/_ → docs/core/_, docs/temp/_, .agents/_
- **级别**: minor

### 🗑️ 移除仓库中的 backend/.env.docker

- **内容**: 从 Git 跟踪中移除 `backend/.env.docker`（本地文件保留），防止敏感配置泄露
- **影响**: backend/.env.docker (git rm --cached)
- **级别**: patch

## 2026-06-06

### � 退出登录修复 — Pinia store 内 useRouter 不可用

- **问题**: 点击"退出登录"无反应，控制台报 `Cannot read properties of undefined (reading 'push')`
- **根因**: Pinia store 中 `useRouter()` 返回 `undefined`，无法执行 `router.push('/auth')`
- **修复**: `auth.ts` logout() 仅清空 token；路由跳转移至 `AppLayout.vue` 组件内 `useRouter()` 调用
- **影响**: auth.ts, AppLayout.vue
- **级别**: minor

### �📋 任务页 & 剧本编辑器 & 导入流程 多项优化

- **导入流程**: 文件上传后显示文件名+解锁"下一步"按钮；粘贴文本即显按钮；Step 2~4 加左上角返回按钮
- **Agent 流水线**: 时间戳 `2026-06-06T04:34:38Z` → `06-06 04:34`；Agent 名汉化；名字/状态/时间 1:1:1 等宽；标题改为"分析进度"；进行中用旋转 ⏳ 替代假进度条
- **任务列表**: 补充任务名；首页+分析任务表格 5 列均分+居中
- **剧本编辑**: 分屏/仅编辑/仅预览高度修复；工具栏按钮放大；导出改为弹窗选择文件名+格式
- **布局**: 禁用 body 滚动，滚轮仅限 `.main` 内部
- **影响**: ImportPage.vue, TaskDetailPage.vue, HomePage.vue, TaskListPage.vue, ScriptEditorPage.vue, AppLayout.vue, App.vue, task.repository.ts, task.service.ts
- **级别**: minor

### 🎨 暗色模式全站适配 + 用户退出按钮 + 通知面板优化

- **问题**: 暗色模式下主内容区及 Element Plus 组件白底不变、无退出登录入口、通知面板右对齐
- **修复内容**:
  - **暗色模式**: `main.ts` 导入 `element-plus/theme-chalk/dark/css-vars.css` 官方暗色变量
  - **暗色模式**: `AppLayout.vue` `.app-layout`/`.main` 增加暗色 background/color + 0.3s 过渡
  - **用户退出**: 👤 悬浮弹出居中"退出登录"按钮，调用 `auth.logout()` 清除 token
  - **通知面板**: 🔔 悬浮+点击均弹出，`left:50% + translateX(-50%)` 居中对齐
- **影响**: main.ts, AppLayout.vue, NotificationCenter.vue
- **级别**: minor

### 🎨 前端全站响应式布局改造 — px 固定尺寸 → vh/vw/clamp 弹性单位

- **问题**: 桌面大面积空白（max-width 限制）、侧边栏 180px 不缩放、字号固定偏小、手机屏侧边栏占 48%
- **修复内容**:
  - **布局骨架**: `AppLayout.vue` 引入 CSS 变量 `--sidebar-w`/`--header-h` + `clamp()` 全局驱动
  - **侧边栏**: `180px` → `clamp(60px, 15vw, 280px)` 全尺寸自适应
  - **顶栏**: `50px` → `clamp(56px, 10vh, 96px)` + 图标左移 5vw
  - **主内容**: 5 个 views 移除 `max-width` 限制 → `width: 100%` 填满
  - **字号**: 全站 `clamp(14px, 1vw, 22px)` 弹性缩放
  - **登录页**: 卡片 `90vw` 响应式 + 401 不跳转显示真实错误
  - **编辑器**: `calc` → `clamp()` 同步布局变量
- **影响**: AppLayout.vue, 5 views, AuthPage.vue, ScriptEditorPage.vue, request.ts
- **级别**: major

### 🔧 密码重置双验证 — username + account 双重校验

- **问题**: 密码重置仅校验 username，且 Zod 校验拒绝空 newPassword 导致验证步骤失败
- **修复内容**:
  - `ResetPasswordDto` 新增 `account` 字段，`newPassword` 改为可选
  - `auth.service.ts` 新增 `verifyUsernameAndAccount()` 同时校验两字段
  - 前端 `AuthPage.vue` Step1 新增账号输入框
- **影响**: request.dto.ts, auth.controller.ts, auth.service.ts, auth.ts, AuthPage.vue
- **级别**: minor

### 🔧 登录 401 误触发页面刷新

- **问题**: 登录失败返回 401 → Axios 拦截器无条件跳转 `/auth` → 页面白屏刷新
- **修复**: `request.ts` 拦截器增加 `isLoginRequest` 判断，登录 401 不跳转
- **影响**: request.ts
- **级别**: minor

### 🔧 训练数据记忆泄露修复 — AI 认出知名作品后自动填充作者/书名

- **问题**: 输入《斗破苍穹》文本，AI 输出了"作者: 我吃西红柿"、"标题: 吞噬星空·校园篇"等训练数据中的信息
- **根因**: DeepSeek 训练时见过《吞噬星空》，认出文本后从记忆里调取作者/书名，模型认为这是"已知事实"不算编造
- **修复内容**:
  - 全部 5 个 Prompt 新增 **反泄露约束**: "禁止使用你对知名作品的先验知识，即使认出文本来源也只分析提供的片段"
  - `script-generation`: title 必须从原文提炼，author 原文未提填"未知"
  - `character-extraction`: 只提取本次片段实际出现的角色
  - `plot-analysis`: 不用训练数据中的后续情节填补
- **影响**: novel-analysis.prompt.ts, character-extraction.prompt.ts, plot-analysis.prompt.ts, scene-planning.prompt.ts, script-generation.prompt.ts
- **级别**: major

### 🔧 任务失败修复 — AgentResult 缺失 FaithfulnessCheck

- **问题**: AI 分析小说后输出的剧本包含原文中不存在的角色、对白、情节（非联网搜索，而是上下文截断 + 高温幻觉）
- **根因**: ① Step 2~5 仅取前 6000 字(丢失 88%+ 内容) ② 温度 0.7~0.8 鼓励编造 ③ Prompt 缺少忠实约束 ④ 无忠实度校验
- **修复内容**:
  - **上下文截断**: `fullText.slice(0,6000)` → `buildSmartSummary(fullText, 20000)` 智能均匀采样
  - **温度降低**: ScenePlanning 0.7→0.4, ScriptGeneration 0.8→0.5
  - **忠实约束**: 全部 6 个 Prompt 添加 "严格仅基于文本，不得编造推测" 约束
  - **原文注入**: Steps 4~5 新增 `{sourceText}` 参数注入原文采样
  - **忠实度校验**: 新增 Step 6.5 `FaithfulnessCheck` — 比对剧本与原文，自动检测编造内容
- **影响**: ai.service.ts, deepseek.ts, text-chunker.ts, 7 个 prompt 文件, generate-script.worker.ts
- **级别**: major

### 📝 文档更新

- **AI_WORKFLOW.md**: 新增智能摘要策略、忠实约束规范、FaithfulnessCheck 步骤；更新温度表、任务拆解表、上下文链
- **CHANGELOG**: 本条目
- **ARCHITECTURE.md**: Agent 流水线步骤从 7 步更新为 8 步

### �🐳 Docker 化完善

- **修复**: Docker 构建与运行时多项问题
- **内容**:
  - Dockerfile：添加 `prisma.config.ts` 复制，移除 tsc 编译步骤，改用 `tsx src/main.ts` 直接运行
  - 修复 `.env.docker` 中 `DATABASE_URL` 多余引号导致 Prisma 找不到数据库
  - `docker-compose.yml`：command 同步更新为 `tsx` 运行方式
  - 新增 `docker-compose.dev.yml`：开发模式仅启动 Redis + MinIO，后端本地热重载
- **影响**: Dockerfile, docker-compose.yml, .env.docker
- **级别**: major

### 🔧 TypeScript 编译修复（15 处）

- **修复文件**: `package.json` + 8 个源文件
- **修复内容**:
  - 添加 `yaml` 包到依赖（`yaml-validator.ts` 缺少）
  - 移除 `bullmq` 中已废弃的 `QueueScheduler` 导入
  - 4 个 Worker 文件的 ioredis 类型不匹配 → 改用 `redisConnection` (ConnectionOptions)
  - `auth.service.ts` JWT `expiresIn` 类型断言
  - `script.controller.ts` / `task.controller.ts` 中 `req.params` 类型为 `string | string[]` → `as string`
  - `script.service.ts` 中 `prisma.$transaction()` 类型不兼容 → `as any`
  - `tsx` 和 `prisma` 从 devDependencies 移至 dependencies（生产环境需要）
- **影响**: package.json, queue-manager.ts, 4 worker 文件, auth.service.ts, 2 controller, script.service.ts
- **级别**: major

### 📝 文档更新

- **README**: 快速开始新增 Docker Compose 一键启动为首选方案，手动方式保留为备选
- **PROJECT_STATE**: 产物清单新增 Docker 部署行，Iter-1 目标追加 Docker 化
- **CHANGELOG**: 本文件

## 2026-06-05

### �📋 项目初始化

- **项目**: 创建项目 `NovelToScript` — AI小说转剧本工具
- **影响**: 全局
- **级别**: major

### 📋 上下文管理文档

- **文档**: 创建 `docs/prem/` 上下文管理文档体系
- **文档列表**:
  - PRD.md — 产品需求文档
  - DESIGN.md — 系统设计文档
  - DECISIONS.md — 架构决策记录
  - PAGE_SPECS.md — 页面规格说明
  - API_SPECS.md — 接口规格说明
  - PROJECT_STATE.md — 项目状态追踪
  - TASKS.md — 任务看板
- **影响**: 项目管理
- **级别**: major

### 📋 PRD 需求拆解

- **文档**: PRD.md 经 RequirementAnalyzer 深度拆解
- **新增内容**:
  - 业务流程图（Mermaid graph + sequence diagram）
  - 6 个页面的「模块→功能→数据」三级拆解
  - 14 条疑问列表，覆盖格式/边界/容错/权限
- **影响**: PRD
- **级别**: major

### 📋 需求澄清 — 5 项确认

- **来源**: 产品方对疑问列表的回复
- **确认内容**:
  1. ✅ 支持文件格式: `.txt` `.docx` `.md`
  2. ✅ 需要用户登录系统，新增 P0 登录注册页（用户名+账号+密码，账号不可重复，密码重置验证用户名）
  3. ✅ 剧本编辑需要版本历史+回滚
  4. ✅ 导出格式: yaml / json / md / pdf / txt
  5. ✅ 任务失败支持断点重试或从头开始
- **影响文档**:
  - PRD.md — 新增 R7 用户认证、P0 页面、版本历史模块、重试模式
  - PAGE_SPECS.md — 新增 P0 登录注册页
  - API_SPECS.md — 新增 8 个接口（A0a-A0c 认证, A10 重试, A11-A13 版本历史, A14 导出）
  - PROJECT_STATE.md — 同步页面/接口清单
- **级别**: major

### 📋 需求澄清 — 全部疑问确认（9 项）

- **来源**: 产品方对剩余疑问的回复（Q2/Q3/Q5/Q7/Q10/Q11/Q12/Q13/Q14）
- **确认内容**:
  1. ✅ 章节识别 — 五级兜底：规则→目录→AI→切片→人工，内置6条正则+自定义
  2. ✅ 文件限制 — 单文件20MB, 3~100章, 单项目50万字, 单用户500MB
  3. ✅ 并发限制 — 运行1/排队3
  4. ✅ 文本分片 — 三级：章节→段落→语义, Agent输入5000~8000字
  5. ✅ Schema — 多版本共存 + extensions 扩展区
  6. ✅ Agent职责 — Plot Extraction(事件/冲突/转折), Scene Planning(时间/地点/参与者/目标)
  7. ✅ 润色风格 — 7种：原著还原/影视剧/短剧/动漫/电影/电视剧/舞台剧
  8. ✅ 存储策略 — 原文+中间30天清理，最终剧本长期保存
  9. ✅ 前端缓存 — 四级：localStorage+IndexedDB
- **影响文档**:
  - PRD.md — 约束条件表、章节识别五级策略、Agent职责定义、P5缓存模块、疑问全部✅
  - PAGE_SPECS.md — P2章节识别设置、P5润色风格选择+缓存指示
  - DESIGN.md — 缓存架构、Agent职责边界、并发/分片/存储生命周期
  - DECISIONS.md — 新增 D-008~D-012 共5条架构决策
- **级别**: major
- **备注**: 14条疑问全部确认完毕，PRD 进入可开发状态

### 📋 设计文档生成

- **文档**: 新建 `PAGE_DESIGN.md` — 基于 DesignGenerator 输出
- **内容覆盖**:
  - 7 页完整设计：P0~P6（布局ASCII + 组件树 + 数据来源 + 交互说明 + 目录建议）
  - 全局布局：侧边导航 + 顶栏（企业风格）
  - 组件清单：48 个组件（12 通用 + 36 业务），标注复用性
  - 数据流图：Pinia Store → Axios Interceptor → API Layer → 离线缓存
  - 全局目录总览：`src/` 完整文件树
  - 5 条待确认疑问
- **影响**: 前端设计
- **级别**: major

### 📋 设计确认 — 5 项

- **来源**: 设计文档疑问确认
- **确认内容**:
  1. ✅ 全局消息通知中心（剧本生成/润色完成/任务失败推送）
  2. ✅ 响应式适配（<768px 移动端：底部Tab+抽屉菜单）
  3. ✅ Monaco Editor 无需自定义 language server
  4. ✅ PDF 导出双方案：正式→后端Puppeteer，快速预览→前端jsPDF
  5. ✅ 暗色模式支持（ThemeToggle + Pinia theme store）
- **影响文档**:
  - PAGE_DESIGN.md — 全局布局增加移动端布局+暗色模式、P5 PDF导出双方案、数据流图+stores+components同步
- **级别**: minor

### 📐 ASCII 布局优化

- **来源**: AsciiLayoutGenerator 规范化
- **优化内容**:
  - 全部 9 个布局图统一为 **52 字符宽**
  - 表格列数 ≤6，表头+数据行对齐
  - 按钮标准格式 `[ 搜索 ] [ 重置 ]`
  - 弹窗/抽屉/下拉菜单移出布局图，改为"布局说明"文字描述
  - 每页新增"布局说明"段落，描述结构关系和交互方式
  - 全局布局增加移动端 ASCII 图
- **影响文档**: PAGE_DESIGN.md
- **级别**: patch

### 📐 布局优化评审（LayoutOptimizer）

- **文档**: 新建 `LAYOUT_REVIEW.md` + 修复 PAGE_DESIGN.md
- **评审结果**: 总评分 **79/100** 🟡 良好
- **修复项**:
  - 🔴 P2 — 旧格式布局同步为新格式（去侧边栏，52宽利用，内置规则默认折叠）
  - 🔴 P4 — 增加 `← 返回任务列表` 面包屑导航
  - 🟡 P3 — 增加 `[ + 新建任务 ]` 按钮
  - 🟡 P5 — 工具栏主次分离（保存突出 + `··· 更多▼`）+ 视图切换按钮
  - 🟢 P1/P3 — 增加空状态占位
- **影响文档**: PAGE_DESIGN.md, LAYOUT_REVIEW.md
- **级别**: patch

### 📱 低保真原型生成

- **文档**: 新建 `LOWFI_PROTOTYPE.md` — 基于 LowFiPrototypeGenerator 输出
- **内容覆盖**:
  - 7 页完整原型：P0~P6（页面目标 + 组件清单含属性 + 交互流程含异常分支 + 状态矩阵 + 组件树）
  - 每页覆盖 **4~8 种状态**（加载中/有数据/空数据/错误/弹窗/离线等）
  - **34 条交互流程** ASCII 箭头图，全部覆盖正常流 + 异常流
  - **7 棵组件树**含子组件属性标注，弹窗/抽屉独立子树
  - Figma / Excalidraw / Whimsical 三工具适配提示
  - 全局状态通用说明（骨架屏 + 错误重试）
- **影响**: 前端原型
- **级别**: major

### 🖥️ HTML 交互原型

- **文件**: 新建 `prototype/index.html` — 浏览器直接打开，零依赖
- **内容**: 7 页交互原型（P0~P6），侧边栏导航 + 暗色模式 + 通知中心
- **视觉风格**: 毛玻璃磨砂质感（backdrop-filter blur + 四色渐变背景）
- **登录 UX**: 登录页不展示侧边栏，全屏居中卡片；登录后 `.logged-in` 类切换显示
- **亮点**: P4 Agent流水线模拟、P5 左右分屏编辑器、P2 步骤条交互、Schema树形结构
- **技术**: 纯 HTML/CSS/JS，CSS 变量主题切换
- **影响**: 前端原型, DECISIONS（+D-013, D-014）, PROJECT_STATE
- **级别**: major

### 🏗️ 后端架构设计

- **文档**: 新建 `ARCHITECTURE.md` — 基于 BackendArchitectureGenerator 输出
- **内容覆盖**（18 章节）:
  - 系统概览 + 架构风格（Modular Monolith）
  - 10 个业务模块 + 领域模型（10 实体 + 聚合边界）
  - 分层架构（Controller/Service/Repository/DTO/Validator）
  - 完整目录结构（`server/src/` 含 AI agents/prompts/queue/storage）
  - 数据库设计（9 表 + 索引 + 唯一约束）
  - 缓存设计（6 缓存项 + Cache-Aside + TTL）
  - 队列设计（4 队列 + Job 定义 + 死信队列）
  - MinIO 存储设计（4 Bucket + 生命周期 + 路径规范）
  - AI 工作流（7 Agent 流水线 + 文本分片 + Prompt 模板）
  - 权限架构（RBAC Author/Admin + 权限矩阵）
  - 安全设计（JWT + Rate Limit + 上传白名单 + AI 安全）
  - 扩展性（LLM/Storage/Queue 三抽象接口 + 6 扩展点）
  - 部署建议（Docker Compose + Dockerfile + .env）
  - 技术选型（18 项技术版本建议）
  - 架构风险（8 条 RISK） + API↔模块映射
- **影响**: 后端架构
- **级别**: major

### 🗄️ 数据库 Schema 设计

- **文档**: 新建 `DATABASE_SCHEMA.md` + `prisma/schema.prisma`
- **内容覆盖**:
  - 9 张表完整 Prisma 模型（User/Novel/Task/AgentResult/Script/Version/Character/Scene/Dialogue）
  - 4 个枚举（TaskStatus/AgentStatus/CharacterRole/FileFormat）
  - ER 关系图 + 10 条外键设计（含 onDelete 规则）
  - 索引设计（10 条 `@@index` + 4 条 `@@unique`）
  - SQLite 兼容性检查（✅ 通过）
  - Migration 计划（9 步 / 精简 4 步）
  - 性能优化（6 条建议）+ 风险分析（5 条 RISK）
  - 审计字段 + Script 软删除策略
- **影响**: 数据库
- **级别**: major

### 🔌 API 对接方案优化

- **文档**: 重写 `API_SPECS.md` — 基于 ApiIntegrationGenerator + DATABASE_SCHEMA
- **新增内容**:
  - 17 接口完整请求/响应 JSON 示例 + 字段说明表
  - 标准响应壳 `{code, message, data}` + HTTP 状态码表（10 种）
  - 业务错误码（2001~5003）+ 前端处理策略
  - 前端 `src/api/` 封装代码（7 个模块 + axios 拦截器）
  - 缓存策略矩阵（SWR/Cache-First + TTL + 失效条件）
  - 分阶段 Mock 方案（原型→MSW→Vite Proxy）
  - 竞态处理（AbortController + 乐观锁）
  - 接口依赖关系图 + 4 条待确认疑问
- **影响**: 前后端联调
- **级别**: major

### 🧩 组件设计方案

- **文档**: 新建 `COMPONENT_SPECS.md` — 基于 ComponentGenerator
- **内容覆盖**:
  - **43 组件**完整 Props/Emits/Slots 接口定义（8 全局 + 35 页面业务）
  - 7 页组件树（含条件渲染 `v-if` + 数据流向）
  - Pinia Store 规划（5 个 Store: auth/task/script/notification/theme）
  - 全局 Hooks（useSSE + useCache）
  - 全局目录总览 + 组件复用性标注
- **影响**: 前端开发
- **级别**: major

### 📄 页面实现蓝图

- **文档**: 新建 `PAGE_IMPLEMENTATION.md` — 基于 PageGenerator
- **内容**: 路由配置 + 7 页状态管理 + Composable 伪代码 + 12 阶段开发顺序
- **影响**: 前端开发
- **级别**: major

### 🏗️ 前端架构设计

- **文档**: 新建 `FRONTEND_ARCHITECTURE.md`
- **内容**: 16 章节 — 目录结构/组件分层/路由/状态管理/API层/Hook架构/数据流/权限/表单/错误处理/上传/SSE/性能/工程规范
- **影响**: 前端架构
- **级别**: major

### 🚀 前端项目初始化

- **项目**: Vite + Vue 3 + TypeScript 脚手架创建
- **依赖**: Element Plus + Pinia + Vue Router + Axios + Sass
- **已生成**:
  - 4 个类型文件 (`types/api/task/script/novel.ts`)
  - 7 个 API 模块 (`api/request/auth/novels/tasks/tasksSSE/scripts/schema.ts`)
  - 3 个 Pinia Store (`stores/auth/notification/theme.ts`)
  - 路由配置 (`router/index.ts` + AuthGuard)
  - 2 个全局 Hooks (`hooks/useSSE/useCache.ts`)
  - 全局组件占位 (`AppLayout/NotificationCenter/ThemeToggle.vue`)
  - 入口文件 (`main.ts` + `App.vue` + `vite.config.ts`)
  - 完整 `views/` 目录结构（7 页面）
- **影响**: 前端项目
- **级别**: major

### 🧩 全局组件生成

- **文件**: 生成 7 个全局组件 (`frontend/src/components/`)
- **组件列表**:
  - `AppLayout.vue` — 桌面布局: 固定侧边栏(180px) + 固定顶栏(50px) + 主内容区
  - `AppLayoutMobile.vue` — 移动布局: 底部 Tab + 抽屉菜单
  - `CacheIndicator.vue` — 缓存状态指示 (🔒已开启/🔓离线/🔄同步中)
  - `NotificationCenter.vue` — 通知中心: 铃铛按钮 + 下拉消息面板
  - `QueueIndicator.vue` — 队列指示 (运行 X/1 排队 Y/3)
  - `TaskStatusTag.vue` — 任务状态标签 (el-tag 颜色映射)
  - `ThemeToggle.vue` — 暗色模式切换 (太阳/月亮)
- **影响**: 前端组件
- **级别**: major

### 📄 页面容器生成 (P0~P6)

- **文件**: 生成全部 7 个页面 Vue 容器 (`frontend/src/views/`)
- **页面列表**:
  - `Auth/AuthPage.vue` — P0: Tab 切换登录/注册/重置, 账号唯一性检测, JWT 存储
  - `Home/HomePage.vue` — P1: 项目概览卡片 + 快速操作 + 最近任务表 (Loading/Error/Empty 三态)
  - `Import/ImportPage.vue` — P2: 四步导入 (上传→章节识别→元数据→提交), 拖拽+粘贴上传
  - `Tasks/TaskListPage.vue` — P3: 多选筛选 + 分页 + 重试弹窗 (断点/从头) + 删除确认
  - `TaskDetail/TaskDetailPage.vue` — P4: SSE 监听 5 事件更新 7 Agent 状态, 完成后激活编辑器
  - `ScriptEditor/ScriptEditorPage.vue` — P5: 分屏三模式, 30s 自动保存, 导出/润色/版本/回滚
  - `Schema/SchemaPage.vue` — P6: Schema 树 + 字段表搜索 + 设计原因/示例折叠面板
- **影响**: 前端页面
- **级别**: major

### 🔧 P3 TaskListPage 修复

- **修复**: 移除重复 `<script>` 块, `retryMode` ref 统一放入 `<script setup>`
- **影响**: P3 页面
- **级别**: patch

### 🏗️ 后端架构同步更新

- **文档**: 更新 `ARCHITECTURE.md` — 基于 PRD + PAGE_SPECS + API_SPECS + 前端代码审查
- **更新内容**:
  - 标题增加前端代码状态引用
  - Auth 模块补充 `checkAccount` 账号检查接口
  - 新增「前后端同步状态」附录：17 API 的前端封装模块映射
  - 新增「页面→后端模块依赖」表：P0~P6 各页面对应的后端模块
  - 新增「后端初始化待办」11 步清单
- **附带修复**: `PROJECT_STATE.md` 产物清单表格格式化（修复列合并错乱）
- **影响**: 后端架构, 项目管理
- **级别**: minor

### 🗄️ 数据库 Schema 重新生成

- **文档**: 重新生成 `DATABASE_SCHEMA.md` + 更新 `prisma/schema.prisma` — 基于 ARCHITECTURE.md 领域模型
- **变更内容**:
  - 头部引用更新：`BackendArchitectureGenerator` → `ARCHITECTURE.md`
  - Novel 实体：新增架构决策说明（`rawText` 存 MinIO 不存 DB）
  - Script 实体：新增架构决策说明（`content` 存 Version 表）
  - Scene 索引修复：`@@index([versionId])` → `@@index([versionId, sceneNumber])` 与 schema.prisma 同步
  - Character 新增索引：`@@index([scriptId])`（按剧本查询人物）
  - 外键表新增「原因」列：解释 Restrict/Cascade 选择理由
  - 审计字段表新增 `deletedAt` 列，标注软删除
  - 风险表替换 RISK-005（旧 N:N 误判 → 新 Restrict 保护说明），新增 RISK-006（Character 索引缺失）
- **影响**: 数据库设计
- **级别**: patch

### 🔧 Prisma 1:1 关系约束修复

- **问题**: `Novel.script Script?` 与 `Script.@@unique([userId, novelId])` 冲突
  - Prisma 要求 1:1 反向关系的 FK 字段必须是唯一的
  - `novelId` 仅在 `(userId, novelId)` 组合中唯一，不满足 1:1 约束
- **修复**: `Script.novelId` 改为 `@unique`（替代组合唯一约束）
  - 语义：一部小说只有一个剧本（Novel→Script 1:1）
  - `novelId` 自身的唯一性已保证同一小说不重复创建剧本
- **影响文件**: `prisma/schema.prisma`, `docs/prem/DATABASE_SCHEMA.md`
- **级别**: patch

### 🔌 API_SPECS 补充 — 缺失接口补全

- **审查**: 对比 PAGE_SPECS + DATABASE_SCHEMA + 前端 `api/` 模块，发现 2 个缺失接口
- **新增 A0d — 账号可用性检查**: `GET /api/auth/register?check=account&value=xxx`
  - 响应: `{ "available": true|false }`
  - 前端: `authApi.checkAccount()` — P0 注册页实时唯一性校验
- **新增 A15 — 删除任务**: `DELETE /api/tasks/:id`
  - 响应: `{ "code":0, "data":null }`
  - 前端: `taskApi.delete()` — P3 任务列表删除操作
- **接口总计**: 14 → **16 个**（A0a~A0d + A1~A15）
- **影响**: API 规格
- **级别**: patch

### 🏗️ 后端 DTO + 错误码初始化

- **新建**: `server/src/shared/` — 后端共享层代码
- **文件清单**:
  - `dto/request.dto.ts` — 16 接口的全部 Request DTO + Zod 校验 schema（RegisterDto, LoginDto, CreateTaskDto, UpdateScriptDto, PolishScriptDto 等 20 个类型）
  - `dto/response.dto.ts` — 全部 Response DTO（ApiResponse<T>, PaginatedData<T>, TaskDetailResponse, ScriptDetailResponse, SchemaResponse 等 20 个类型）
  - `errors/error-codes.ts` — 16 个业务错误码 + `AppError` 异常类 + `Errors` 工厂 + `success()/paginated()` 响应辅助
  - `index.ts` — barrel re-export
- **特点**:
  - 文件名/字段限制通过 Zod 原生校验（`.min().max().regex()`）
  - `AppError` 自动推断 HTTP 状态码（409/404/401/429/400/500）
  - 错误码按模块分段（Auth 2001+, Task 3001+, Script 4001+, Novel 5001+）
- **影响**: 后端开发
- **级别**: major

### 📋 SERVICE_SPECS — Service 层设计

- **文档**: 新建 `SERVICE_SPECS.md` — 基于 API_SPECS (16接口) + DATABASE_SCHEMA (9表)
- **内容**: 16 章节完整设计
- **Service 清单**: 11 个 Service（User/Novel/Task/Script/Version/Character/AI/Polish/Export/Schema/Storage）
- **核心设计**:
  - TaskService 状态流转: `QUEUED → PROCESSING → COMPLETED/FAILED`
  - ScriptService 聚合根: updateScript 含乐观锁 CAS, rollbackScript 以新 Version 回退
  - AIService: 7 Agent 流水线 + 三级文本分片 + BullMQ 异步编排
  - 8 个事务点 + 5 个缓存项 + 8 条风险分析
  - 全部 16 API 的 Controller→Service 映射表
- **影响**: 后端架构
- **级别**: major

### 🗄️ REPOSITORY_SPECS — Repository 层设计

- **文档**: 新建 `REPOSITORY_SPECS.md` — 基于 DATABASE_SCHEMA (9表) + SERVICE_SPECS
- **Repository 清单**: 9 个（User/Novel/Task/AgentResult/Script/Version/Character/Scene/Dialogue）
- **核心设计**:
  - 每个 Repository 含完整 CRUD + Prisma 实现代码示例
  - Script 软删除: 所有查询默认 `WHERE deletedAt IS NULL`
  - 统一分页规范: `PaginationParams → skip/take` + 并行 count
  - 11 项索引依赖对照 + 5 条风险分析
  - Service→Repository 依赖关系图
- **影响**: 后端架构
- **级别**: major

### ⚡ QUEUE_SPECS — BullMQ 队列架构

- **文档**: 新建 `QUEUE_SPECS.md` — 基于 SERVICE_SPECS + ARCHITECTURE AI 工作流
- **队列清单**: 4 个（script-generation | script-polish | export-pdf | cleanup）
- **核心设计**:
  - 4 个 Worker 完整实现代码（含 SSE 推送、进度更新、异常处理）
  - Task 状态机: `QUEUED → PROCESSING → COMPLETED/FAILED`
  - 重试: script-generation 3次(指数退避), polish/export 2次
  - 超时: 600s/120s/60s/300s 分级
  - 并发: 1/1/2/1 (PRD 约束: 运行1+排队3)
  - Cron: cleanup 每天03:00
  - 监控: Bull Board 面板 + 6项指标
  - 6 条风险分析 (2 High + 3 Medium + 1 Low)
- **影响**: 后端架构
- **级别**: major

### 🤖 AI_WORKFLOW — LangChain + DeepSeek AI 工作流

- **文档**: 新建 `AI_WORKFLOW.md`
- **内容**: 15 章节完整设计
- **Chain 清单**: 7 条 (NovelAnalysis → CharacterExtraction → PlotAnalysis → ScenePlanning → ScriptGeneration → YamlValidation → ScriptPolish)
- **核心亮点**:
  - 7 个完整 Prompt 模板 + 变量占位符 + 输出格式
  - DeepSeek 双温策略: 分析类 0.3 / 创作类 0.7~0.8
  - 三级分片: 章节→段落→语义, 8000字/片 + 200 overlap
  - 三层校验: Parser(代码) → Zod(Schema) → AI(语义)
  - Token 估算: 30章小说 ~180K tokens
  - 8 条风险分析 (2 High + 4 Medium + 2 Low)
- **影响**: AI 设计
- **级别**: major

### 🚀 后端基础设施代码生成

- **生成**: `backend/` 项目配置 + 基础设施层代码
- **config/ (3文件)**:
  - `env.ts` — 环境变量加载 + 类型定义（PORT/DB/Redis/MinIO/JWT/DeepSeek）
  - `cors.ts` — CORS 配置（开发 localhost:5173）
  - `deepseek.ts` — 三温模型实例（analysis 0.3 / creative 0.7 / generation 0.8）
- **shared/infra (4文件)**:
  - `database/prisma.ts` — PrismaClient 单例 + connect/disconnect
  - `cache/redis.ts` — ioredis 连接管理 + 自动重连
  - `queue/queue-manager.ts` — 4 个 BullMQ 队列定义 + 并发检查
  - `storage/minio.ts` — MinIO 客户端 + 4 Bucket 初始化 + 路径工具
- **项目配置**:
  - `package.json` — 17 依赖 + 6 脚本（dev/build/start/worker/migrate/studio）
  - `tsconfig.json` — ES2022 + paths `@/*`
  - `.env` — 完整环境变量模板
- **影响**: 后端项目
- **级别**: major

### 🚀 后端业务代码生成

- **Repository (9)**: User/Novel/Task/AgentResult/Script/Version/Character/Scene/Dialogue
- **Service (4)**: AuthService(注册/登录/重置/查重), NovelService(导入+MinIO), TaskService(创建/列表/详情/重试/删除+队列), ScriptService(CRUD+版本+回滚+软删除)
- **Route (4)**: auth/task/novel/script — 15 API 含 Zod 校验 + JWT 认证
- **Middleware (3)**: auth(JWT验证+optional), error(AppError+ZodError), validate(Zod schema)
- **入口**: `app.ts` (Express+SSE+健康检查) + `main.ts` (DB/Redis/MinIO初始化+Graceful Shutdown)
- **Worker (4)**: generate-script + polish-script + export-pdf + cleanup
- **AI (17)**: `ai.service.ts` (AgentPipeline) + 7 Chain + 7 Prompt + Chunker + Parser
- **Utils (3)**: `chapter-detector` (五级兜底), `yaml-validator` (本地校验), `logger` (Pino)
- **影响**: 后端代码
- **级别**: major

---

## ✅ 后端项目完成总结

**NovelToScript 后端项目已全部生成完毕** — 覆盖全部 21 个 Skill 步骤：

| #        | 层                             | 文件数      | 状态 |
| -------- | ------------------------------ | ----------- | ---- |
| 1        | Config                         | 3           | ✅   |
| 2        | Middleware                     | 3           | ✅   |
| 3        | DTO                            | 2           | ✅   |
| 4        | Error Codes                    | 1           | ✅   |
| 5        | Infra (DB/Cache/Queue/Storage) | 4           | ✅   |
| 6        | Repository                     | 9           | ✅   |
| 7        | Service                        | 9           | ✅   |
| 8        | Controller                     | 4           | ✅   |
| 9        | Routes                         | 5           | ✅   |
| 10       | Queue Manager                  | 1           | ✅   |
| 11       | Worker                         | 4           | ✅   |
| 12       | AI Module                      | 17          | ✅   |
| 13       | Utils                          | 3           | ✅   |
| 14       | Entry (main+app)               | 2           | ✅   |
| **总计** |                                | **66 文件** | ✅   |

**技术栈**: Node.js + Express + TypeScript + Prisma 7 + SQLite + BullMQ + Redis + MinIO + LangChain + DeepSeek + Zod + Pino

**运行方式**:

```bash
cd backend
npm run dev          # API 服务器
npm run worker       # BullMQ Worker
npm run db:migrate   # Prisma 迁移
```

## 后端bug修复

### [Fixed] 修复 `GET /api/tasks` 及其他带 query 参数接口的 500 错误

**问题**：所有使用 `validate(schema, "query")` 中间件的 GET 接口均返回 `500 Internal Server Error`（错误码 `9001`），例如 `GET /api/tasks?pageSize=5`。

**根因**：Express 5 中 `req.query` 是原型链上的 getter-only 属性（无 setter）。`validate` 中间件中的直接赋值 `req.query = data` 在 CommonJS 模式下**静默失败**，导致 Zod 校验并转换后的数据（如 `pageSize` 由字符串 `"5"` 转为数字 `5`）未能生效。后续 Prisma 查询收到字符串类型参数而抛出异常。

**修复**：validate.middleware.ts — 对 `source === "query"` 改用 `Object.defineProperty(req, "query", { value: data })` 强制覆盖原型 getter。

**影响文件**：

- validate.middleware.ts

**受益路由**（同中间件修复覆盖）：

- `GET /api/tasks` — 任务列表查询
- `GET /api/scripts/:id/export` — 剧本导出
- `GET /api/auth/register` — 账号可用性检查

---
