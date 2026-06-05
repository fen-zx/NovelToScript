# CHANGELOG — 变更记录

## 2026-06-05

### 📋 项目初始化

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
