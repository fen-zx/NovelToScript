# 组件设计方案 — AI小说转剧本工具

> 基于 PAGE_SPECS + API_SPECS 生成 | Vue 3 + Element Plus + TypeScript
> 状态管理: Pinia | 路由: Vue Router

---

## 全局组件

### AppLayout

| 属性         | 内容                                                   |
| ------------ | ------------------------------------------------------ |
| **职责**     | 桌面端全局布局：侧边导航 + 顶栏 + `<router-view>` 插槽 |
| **文件路径** | `src/components/AppLayout.vue`                         |
| **复用性**   | 高（全局唯一）                                         |

**Slots**

| 插槽名    | 说明     |
| --------- | -------- |
| `default` | 主内容区 |

### AppLayoutMobile

| 属性         | 内容                                              |
| ------------ | ------------------------------------------------- |
| **职责**     | 移动端布局：底部 Tab + 抽屉菜单 + `<router-view>` |
| **文件路径** | `src/components/AppLayoutMobile.vue`              |
| **复用性**   | 高                                                |

### AuthGuard

| 属性         | 内容                                 |
| ------------ | ------------------------------------ |
| **职责**     | 路由守卫组件，未登录时重定向 `/auth` |
| **文件路径** | `src/components/AuthGuard.vue`       |
| **复用性**   | 高                                   |

**Props**: 无（从 Pinia auth store 读取 token）

### NotificationCenter

| 属性         | 内容                                           |
| ------------ | ---------------------------------------------- |
| **职责**     | 全局消息通知弹窗（剧本完成/润色完成/任务失败） |
| **文件路径** | `src/components/NotificationCenter.vue`        |
| **复用性**   | 高                                             |

**Props**

| 属性名    | 类型      | 说明     |
| --------- | --------- | -------- |
| `visible` | `boolean` | 面板显隐 |

**Emits**: `close` — 关闭面板

### ThemeToggle

| 属性         | 内容                             |
| ------------ | -------------------------------- |
| **职责**     | 暗色/亮色模式切换                |
| **文件路径** | `src/components/ThemeToggle.vue` |
| **复用性**   | 高                               |

**内部状态**: 读写 Pinia theme store

### TaskStatusTag

| 属性         | 内容                               |
| ------------ | ---------------------------------- |
| **职责**     | 任务状态彩色标签                   |
| **文件路径** | `src/components/TaskStatusTag.vue` |
| **复用性**   | 高（P1/P3/P4 复用）                |

**Props**

| 属性名   | 类型         | 必填 | 说明                                     |
| -------- | ------------ | ---- | ---------------------------------------- |
| `status` | `TaskStatus` | ✅   | QUEUED / PROCESSING / COMPLETED / FAILED |

### QueueIndicator

| 属性         | 内容                                |
| ------------ | ----------------------------------- |
| **职责**     | 队列状态指示                        |
| **文件路径** | `src/components/QueueIndicator.vue` |
| **复用性**   | 中                                  |

**Props**

| 属性名       | 类型     | 说明     |
| ------------ | -------- | -------- |
| `running`    | `number` | 运行中   |
| `queued`     | `number` | 排队中   |
| `maxRunning` | `number` | 运行上限 |
| `maxQueued`  | `number` | 排队上限 |

### CacheIndicator

| 属性         | 内容                                |
| ------------ | ----------------------------------- |
| **职责**     | 离线缓存状态指示                    |
| **文件路径** | `src/components/CacheIndicator.vue` |
| **复用性**   | 中                                  |

**Props**

| 属性名   | 类型                                 | 说明     |
| -------- | ------------------------------------ | -------- |
| `status` | `'active' \| 'offline' \| 'syncing'` | 缓存状态 |

---

## P0 — 登录注册页

### 组件树

```
AuthPage
├── AuthTabs
│   └── Tab × 3 (登录/注册/重置密码)
├── LoginForm        (v-if="tab==='login'")
│   ├── Input (account)
│   ├── Input (password)
│   ├── Link (忘记密码?)
│   └── Button (登录)
├── RegisterForm     (v-if="tab==='register'")
│   ├── Input (username)
│   ├── Input (account) + 唯一性校验
│   ├── Input (password)
│   └── Button (注册)
└── ResetPwdForm     (v-if="tab==='reset'")
    ├── Input (username)
    ├── Button (验证)
    ├── Input (newPassword, disabled initially)
    └── Button (提交)
```

---

### LoginForm

| 属性         | 内容                                      |
| ------------ | ----------------------------------------- |
| **职责**     | 账号密码登录表单                          |
| **文件路径** | `src/views/Auth/components/LoginForm.vue` |
| **复用性**   | 低                                        |

**Emits**

| 事件名       | 载荷                                  | 触发             |
| ------------ | ------------------------------------- | ---------------- |
| `login`      | `{ account:string, password:string }` | 点击登录 / Enter |
| `switch-tab` | `'register' \| 'reset'`               | 点击切换链接     |

**内部状态**

| 状态            | 类型      | 默认值  |
| --------------- | --------- | ------- |
| `form.account`  | `string`  | `''`    |
| `form.password` | `string`  | `''`    |
| `submitting`    | `boolean` | `false` |
| `errorMsg`      | `string`  | `''`    |

---

### RegisterForm

| 属性         | 内容                                         |
| ------------ | -------------------------------------------- |
| **职责**     | 新用户注册表单                               |
| **文件路径** | `src/views/Auth/components/RegisterForm.vue` |

**Emits**

| 事件名       | 载荷                              | 触发     |
| ------------ | --------------------------------- | -------- |
| `register`   | `{ username, account, password }` | 点击注册 |
| `switch-tab` | `'login'`                         | 已有账号 |

**内部状态**: `form`, `accountAvailable`, `checking`, `submitting`

---

### ResetPwdForm

| 属性         | 内容                                         |
| ------------ | -------------------------------------------- |
| **职责**     | 两步密码重置                                 |
| **文件路径** | `src/views/Auth/components/ResetPwdForm.vue` |

**Emits**

| 事件名       | 载荷                        | 触发     |
| ------------ | --------------------------- | -------- |
| `verify`     | `{ username }`              | 点击验证 |
| `reset`      | `{ username, newPassword }` | 点击提交 |
| `switch-tab` | `'login'`                   | 返回登录 |

**内部状态**: `step`(1/2), `username`, `newPassword`, `verified`

---

### AuthTabs

| 属性         | 内容                                     |
| ------------ | ---------------------------------------- |
| **职责**     | 登录/注册/重置密码 Tab 切换              |
| **文件路径** | `src/views/Auth/components/AuthTabs.vue` |
| **复用性**   | 中                                       |

**Props**

| 属性名   | 类型     | 必填 | 说明                                 |
| -------- | -------- | ---- | ------------------------------------ |
| `active` | `string` | —    | `'login'` / `'register'` / `'reset'` |

**Emits**: `change` → `tabName`

### 状态管理 — AuthPage

| 状态         | 归属               |
| ------------ | ------------------ |
| `currentTab` | AuthPage 本地 ref  |
| `loginError` | LoginForm 内部     |
| `isLoggedIn` | Pinia auth store   |
| API 调用     | 直接调用 `authApi` |

**状态矩阵（AuthPage 父组件）**

| 状态   | tabs     | form     | button      |
| ------ | -------- | -------- | ----------- |
| 初始   | 默认登录 | 空       | 禁用        |
| 填写中 | 可切换   | 部分填写 | 启用        |
| 提交中 | 锁定     | 只读     | loading     |
| 失败   | 可切换   | 保留输入 | 启用 + 错误 |

### 目录

```
src/views/Auth/
├── AuthPage.vue
├── components/
│   ├── AuthTabs.vue
│   ├── LoginForm.vue
│   ├── RegisterForm.vue
│   └── ResetPwdForm.vue
└── hooks/
    └── useAuth.ts       # 登录/注册/登出 + token 管理
```

---

## P1 — 项目首页

### 组件树

```
HomePage
├── ProjectIntro
│   └── Link (新手引导)
├── QuickActions
│   ├── Button (📥 导入小说 → /import)
│   └── Button (📋 查看任务 → /tasks)
└── RecentTaskList
    ├── ElTable
    │   ├── Column (任务名) → Link
    │   ├── Column (状态) → TaskStatusTag (全局复用)
    │   ├── Column (进度) → Progress
    │   ├── Column (时间)
    │   └── Column (操作) → Link (查看)
    ├── EmptyState (v-if="noData")
    └── Link (查看全部 → /tasks)
```

---

### QuickActions

| 属性         | 内容                                         |
| ------------ | -------------------------------------------- |
| **职责**     | 快速操作按钮组                               |
| **文件路径** | `src/views/Home/components/QuickActions.vue` |

**Emits**

| 事件名     | 载荷                  | 触发     |
| ---------- | --------------------- | -------- |
| `navigate` | `'import' \| 'tasks'` | 点击按钮 |

---

### RecentTaskList

| 属性         | 内容                                           |
| ------------ | ---------------------------------------------- |
| **职责**     | 最近 N 条任务摘要                              |
| **文件路径** | `src/views/Home/components/RecentTaskList.vue` |

**Props**

| 属性名  | 类型     | 说明             |
| ------- | -------- | ---------------- |
| `limit` | `number` | 显示条数，默认 5 |

**Emits**

| 事件名      | 载荷             | 触发                  |
| ----------- | ---------------- | --------------------- |
| `view-task` | `taskId: string` | 点击行 → `/tasks/:id` |

### 状态管理

```
HomePage 本地:
  recentTasks: TaskSummary[]
  loading: boolean
  error: string | null

API: GET /api/tasks?pageSize=5
```

### 目录

```
src/views/Home/
├── HomePage.vue
└── components/
    ├── ProjectIntro.vue
    ├── QuickActions.vue
    └── RecentTaskList.vue
```

---

## P2 — 小说导入页

### 组件树

```
ImportPage
├── ImportStepper
│   └── Step × 4 (上传→识别→元数据→确认)
├── StepContent (v-if="step===1")
│   ├── FileDropZone
│   └── TextPasteArea
├── StepContent (v-if="step===2")
│   ├── StrategyTag
│   ├── Progress (命中率)
│   ├── Collapse → CheckboxList (内置规则)
│   ├── RegexRuleEditor
│   └── Button (章节预览 → ChapterPreview Dialog)
├── StepContent (v-if="step===3")
│   └── NovelMetaForm
└── BottomBar
    ├── Button (创建分析任务)
    └── Text (字数统计)
```

---

### ImportStepper

| 属性         | 内容                                            |
| ------------ | ----------------------------------------------- |
| **职责**     | 四步导入进度指示                                |
| **文件路径** | `src/views/Import/components/ImportStepper.vue` |
| **复用性**   | 高                                              |

**Props**

| 属性名    | 类型         | 说明                |
| --------- | ------------ | ------------------- |
| `current` | `number`     | 当前步骤 1-4        |
| `steps`   | `StepItem[]` | `[{title, status}]` |

---

### FileDropZone

| 属性         | 内容                                           |
| ------------ | ---------------------------------------------- |
| **职责**     | 拖拽/点击上传，前端格式+大小校验               |
| **文件路径** | `src/views/Import/components/FileDropZone.vue` |
| **复用性**   | 中                                             |

**Props**

| 属性名    | 类型     | 默认值             | 说明     |
| --------- | -------- | ------------------ | -------- |
| `accept`  | `string` | `'.txt,.docx,.md'` | 允许格式 |
| `maxSize` | `number` | `20 * 1024 * 1024` | 最大字节 |

**Emits**

| 事件名       | 载荷                           | 触发     |
| ------------ | ------------------------------ | -------- |
| `file-ready` | `{ name, text, format, size }` | 校验通过 |

---

### ChapterDetector

| 属性         | 内容                                              |
| ------------ | ------------------------------------------------- |
| **职责**     | 五级兜底章节识别引擎                              |
| **文件路径** | `src/views/Import/components/ChapterDetector.vue` |

**Props**

| 属性名 | 类型     | 说明     |
| ------ | -------- | -------- |
| `text` | `string` | 小说全文 |

**Emits**

| 事件名              | 载荷                                                      | 触发     |
| ------------------- | --------------------------------------------------------- | -------- |
| `chapters-detected` | `{ chapters:Chapter[], strategy:string, hitRate:number }` | 识别完成 |

**内部状态**: `strategy`, `chapters`, `hitRate`, `customRegexes`

---

### RegexRuleEditor

| 属性         | 内容                                              |
| ------------ | ------------------------------------------------- |
| **职责**     | 自定义正则规则增删，实时预览命中行                |
| **文件路径** | `src/views/Import/components/RegexRuleEditor.vue` |

**Props**: `rules` (`RegexRule[]`)
**Emits**: `add` → `{ pattern }`, `remove` → `index`

---

### ChapterPreview

| 属性         | 内容                                             |
| ------------ | ------------------------------------------------ |
| **职责**     | Dialog — 章节列表拖拽排序/合并/拆分              |
| **文件路径** | `src/views/Import/components/ChapterPreview.vue` |

**Props**

| 属性名     | 类型        | 说明     |
| ---------- | ----------- | -------- |
| `visible`  | `boolean`   | 弹窗显隐 |
| `chapters` | `Chapter[]` | 识别结果 |

**Emits**

| 事件名    | 载荷        | 触发         |
| --------- | ----------- | ------------ |
| `confirm` | `Chapter[]` | 用户确认调整 |
| `close`   | —           | 关闭         |

---

### NovelMetaForm

| 属性         | 内容                                            |
| ------------ | ----------------------------------------------- |
| **职责**     | 书名/作者输入                                   |
| **文件路径** | `src/views/Import/components/NovelMetaForm.vue` |
| **复用性**   | 中                                              |

**Emits**: `submit` → `{ title, author }`

### 状态管理

```
ImportPage 本地:
  step: 1|2|3|4
  fileInfo: { name, text, format, size } | null
  chapters: Chapter[]
  title: string, author: string

API: POST /api/novels/import → POST /api/tasks
```

### 目录

```
src/views/Import/
├── ImportPage.vue
├── components/
│   ├── ImportStepper.vue
│   ├── FileDropZone.vue
│   ├── TextPasteArea.vue
│   ├── ChapterDetector.vue
│   ├── RegexRuleEditor.vue
│   ├── ChapterPreview.vue
│   └── NovelMetaForm.vue
├── hooks/
│   ├── useFileImport.ts
│   ├── useChapterDetect.ts
│   └── useImportFlow.ts
└── utils/
    └── chapterRegex.ts
```

---

## P3 — 分析任务页

### 组件树

```
TaskListPage
├── PageHeader
│   ├── Text (📋 分析任务)
│   ├── QueueIndicator (全局复用)
│   └── Button (+ 新建任务 → /import)
├── TaskStatusFilter
│   └── Tag × 5 (全部/排队中/进行中/已完成/失败)
├── TaskTable
│   ├── Column × 5
│   └── TaskRowActions
├── EmptyState (v-if)
├── ErrorState (v-if)
├── Pagination
└── RetryDialog (Dialog, v-if)
```

---

### TaskTable

| 属性         | 内容                                       |
| ------------ | ------------------------------------------ |
| **职责**     | 任务列表表格（含排序）                     |
| **文件路径** | `src/views/Tasks/components/TaskTable.vue` |

**Props**

| 属性名    | 类型            | 必填 | 说明     |
| --------- | --------------- | ---- | -------- |
| `tasks`   | `TaskSummary[]` | ✅   | 任务数据 |
| `loading` | `boolean`       | —    | 加载态   |

**Emits**

| 事件名   | 载荷     | 触发               |
| -------- | -------- | ------------------ |
| `view`   | `taskId` | 点击查看           |
| `retry`  | `taskId` | 点击重试(failed行) |
| `delete` | `taskId` | 点击删除           |

**Slots**: `empty` — 空状态

---

### TaskStatusFilter

| 属性         | 内容                                              |
| ------------ | ------------------------------------------------- |
| **职责**     | 多选状态筛选标签                                  |
| **文件路径** | `src/views/Tasks/components/TaskStatusFilter.vue` |
| **复用性**   | 中                                                |

**Props**

| 属性名       | 类型           | 说明             |
| ------------ | -------------- | ---------------- |
| `modelValue` | `TaskStatus[]` | v-model 选中状态 |

**Emits**: `update:modelValue`

---

### RetryDialog

| 属性         | 内容                                         |
| ------------ | -------------------------------------------- |
| **职责**     | 重试模式确认弹窗                             |
| **文件路径** | `src/views/Tasks/components/RetryDialog.vue` |

**Props**

| 属性名    | 类型      | 说明 |
| --------- | --------- | ---- |
| `visible` | `boolean` |      |
| `taskId`  | `string`  |      |

**Emits**

| 事件名    | 载荷                                   | 说明     |
| --------- | -------------------------------------- | -------- |
| `confirm` | `{ taskId, mode:'resume'\|'restart' }` | 确认重试 |
| `close`   | —                                      | 关闭     |

### 状态管理

```
useTaskList Composable:
  tasks, loading, error
  filters: TaskStatus[]
  pagination: { page, pageSize, total }
  fetchTasks(), retryTask(), deleteTask()
```

### 目录

```
src/views/Tasks/
├── TaskListPage.vue
├── components/
│   ├── TaskTable.vue
│   ├── TaskStatusFilter.vue
│   ├── TaskRowActions.vue
│   └── RetryDialog.vue
└── hooks/
    └── useTaskList.ts
```

---

## P4 — 任务详情页

### 组件树

```
TaskDetailPage
├── Breadcrumb (← 返回任务列表)
├── TaskInfoHeader
│   ├── Text (任务名)
│   ├── TaskStatusTag
│   └── Text (耗时)
├── AgentPipeline
│   └── TimelineItem × 7 (SSE 驱动)
├── AgentResultPanel
│   └── CollapseItem × N (已完成的 Agent)
├── TaskCompleteAction (v-if="done")
│   └── Button (进入剧本编辑)
└── RetryActions (v-if="failed")
```

---

### AgentPipeline

| 属性         | 内容                                                |
| ------------ | --------------------------------------------------- |
| **职责**     | 7 Agent 流水线可视化（SSE 驱动）                    |
| **文件路径** | `src/views/TaskDetail/components/AgentPipeline.vue` |
| **复用性**   | 中                                                  |

**Props**

| 属性名   | 类型           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| `agents` | `AgentState[]` | `[{name, status, time, progress}]` |

**内部逻辑**: 监听 SSE → 更新 agents 数组

---

### AgentResultPanel

| 属性         | 内容                                                   |
| ------------ | ------------------------------------------------------ |
| **职责**     | 已完成 Agent 的结果折叠面板                            |
| **文件路径** | `src/views/TaskDetail/components/AgentResultPanel.vue` |
| **复用性**   | 高                                                     |

**Props**

| 属性名   | 类型          | 说明                    |
| -------- | ------------- | ----------------------- |
| `result` | `AgentResult` | `{ agentName, output }` |

### 状态管理

```
useTaskDetail Composable:
  task: TaskDetail | null
  agents: AgentState[]      ← SSE 推入
  connectSSE(taskId) → cleanup
```

### hooks/useSSE.ts (全局复用)

```ts
export function useSSE(
  url: string,
  handlers: {
    onEvent?: (event: string, data: any) => void;
    onError?: () => void;
  },
) {
  const es = new EventSource(url);
  // 重连逻辑: 2s → 4s → 8s, 最多 3 次
  return () => es.close();
}
```

### 目录

```
src/views/TaskDetail/
├── TaskDetailPage.vue
├── components/
│   ├── TaskInfoHeader.vue
│   ├── AgentPipeline.vue
│   ├── AgentResultPanel.vue
│   └── TaskCompleteAction.vue
└── hooks/
    └── useTaskDetail.ts
```

---

## P5 — 剧本编辑页

### 组件树

```
ScriptEditorPage
├── ScriptToolbar
│   ├── ViewToggle (◐分屏 / 📝仅编辑 / 📖仅预览)
│   ├── Button (💾保存, primary)
│   ├── ExportMenu (Dropdown → yaml/json/md/pdf/txt)
│   ├── PolishDropdown (Dropdown → 7 种风格)
│   └── MoreMenu (校验 / 版本历史)
├── EditorSplitPane
│   ├── YamlEditor (Monaco)
│   └── MarkdownPreview
├── SchemaValidation (Alert + 错误列表)
├── CacheIndicator
├── PolishDialog (Dialog)
├── VersionHistory (Drawer)
└── ExportMenu (Dropdown)
```

---

### YamlEditor

| 属性         | 内容                                               |
| ------------ | -------------------------------------------------- |
| **职责**     | Monaco Editor 封装（YAML + Schema 补全）           |
| **文件路径** | `src/views/ScriptEditor/components/YamlEditor.vue` |
| **复用性**   | 高                                                 |

**Props**

| 属性名       | 类型      | 说明                   |
| ------------ | --------- | ---------------------- |
| `modelValue` | `string`  | v-model 内容           |
| `schema`     | `object?` | Schema 定义（补全用）  |
| `readonly`   | `boolean` | 只读模式（版本预览时） |

**Emits**: `update:modelValue`

---

### MarkdownPreview

| 属性         | 内容                                                    |
| ------------ | ------------------------------------------------------- |
| **职责**     | YAML → Markdown 实时渲染                                |
| **文件路径** | `src/views/ScriptEditor/components/MarkdownPreview.vue` |
| **复用性**   | 中                                                      |

**Props**

| 属性名        | 类型     | 说明        |
| ------------- | -------- | ----------- |
| `yamlContent` | `string` | YAML 源文本 |

**内部**: `yamlToMarkdown()` 转换函数

---

### PolishDialog

| 属性         | 内容                                                 |
| ------------ | ---------------------------------------------------- |
| **职责**     | 润色风格 + 范围选择弹窗                              |
| **文件路径** | `src/views/ScriptEditor/components/PolishDialog.vue` |

**Props**: `visible` (`boolean`)
**Emits**: `confirm` → `{ style, targetSection }`, `close`
**内部状态**: `selectedStyle`, `targetSection`

---

### VersionHistory

| 属性         | 内容                                                   |
| ------------ | ------------------------------------------------------ |
| **职责**     | 右侧抽屉 — 版本列表/预览/回滚                          |
| **文件路径** | `src/views/ScriptEditor/components/VersionHistory.vue` |

**Props**

| 属性名     | 类型      | 说明 |
| ---------- | --------- | ---- |
| `visible`  | `boolean` |      |
| `scriptId` | `string`  |      |

**Emits**

| 事件名     | 载荷              | 触发     |
| ---------- | ----------------- | -------- |
| `rollback` | `version: number` | 点击回滚 |
| `close`    | —                 |          |

---

### SchemaValidation

| 属性         | 内容                                                     |
| ------------ | -------------------------------------------------------- |
| **职责**     | Schema 校验结果面板（错误行号跳转）                      |
| **文件路径** | `src/views/ScriptEditor/components/SchemaValidation.vue` |

**Props**

| 属性名   | 类型                | 说明                       |
| -------- | ------------------- | -------------------------- |
| `errors` | `ValidationError[]` | `[{line, field, message}]` |

**Emits**: `jump-to` → `line: number`

### 状态管理

```
useScriptEditor Composable:
  script: ScriptDetail
  content: string                 ← v-model
  saveStatus: 'saved'|'unsaved'|'saving'
  autoSave(3s IndexedDB, 30s API)
  fetchScript(), saveContent()

useVersionHistory Composable:
  versions: VersionSummary[]
  fetchVersions(), rollbackTo(v)

usePolish Composable:
  polishTaskId, polishStatus
  requestPolish(style), trackPolishSSE()
```

### 目录

```
src/views/ScriptEditor/
├── ScriptEditorPage.vue
├── components/
│   ├── ScriptToolbar.vue
│   ├── YamlEditor.vue
│   ├── MarkdownPreview.vue
│   ├── ExportMenu.vue
│   ├── PolishDialog.vue
│   ├── SchemaValidation.vue
│   └── VersionHistory.vue
├── hooks/
│   ├── useScriptEditor.ts
│   ├── useVersionHistory.ts
│   ├── usePolish.ts
│   └── useSchemaValidate.ts
└── utils/
    └── yamlToMarkdown.ts
```

---

## P6 — YAML Schema 文档页

### 组件树

```
SchemaPage
├── PageHeader + VersionBadge
├── SearchInput (搜索字段名)
├── SchemaTree
│   └── ElTree (节点点击联动表格)
├── SchemaFieldTable
│   └── ElTable (5 列)
├── SchemaRationale (Collapse → Markdown)
└── ScriptExample (Collapse → CodeBlock, copyable)
```

---

### SchemaTree

| 属性         | 内容                                         |
| ------------ | -------------------------------------------- |
| **职责**     | Schema 树形结构可视化                        |
| **文件路径** | `src/views/Schema/components/SchemaTree.vue` |
| **复用性**   | 中                                           |

**Props**: `data` (`SchemaNode[]`)
**Emits**: `node-click` → `fieldPath: string`（联动表格高亮）

---

### SchemaFieldTable

| 属性         | 内容                                               |
| ------------ | -------------------------------------------------- |
| **职责**     | 字段说明表格 + 搜索过滤                            |
| **文件路径** | `src/views/Schema/components/SchemaFieldTable.vue` |

**Props**

| 属性名      | 类型            | 说明         |
| ----------- | --------------- | ------------ |
| `fields`    | `SchemaField[]` |              |
| `highlight` | `string?`       | 高亮字段路径 |

**内部状态**: `searchQuery`, `requiredFilter`

### 目录

```
src/views/Schema/
├── SchemaPage.vue
├── components/
│   ├── SchemaTree.vue
│   ├── SchemaFieldTable.vue
│   ├── SchemaRationale.vue
│   └── ScriptExample.vue
└── hooks/
    └── useSchema.ts
```

---

## Pinia Store 规划

| Store                  | 文件                         | 内容                                       |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| `useAuthStore`         | `src/stores/auth.ts`         | token, user, login(), logout(), isLoggedIn |
| `useTaskStore`         | `src/stores/task.ts`         | currentTask SSE 状态（P4 消费）            |
| `useScriptStore`       | `src/stores/script.ts`       | 当前编辑剧本 + 自动保存标记                |
| `useNotificationStore` | `src/stores/notification.ts` | 消息队列 push/shift                        |
| `useThemeStore`        | `src/stores/theme.ts`        | dark/light 模式持久化                      |

---

## 全局目录总览

```
src/
├── components/           # 全局复用
│   ├── AppLayout.vue
│   ├── AppLayoutMobile.vue
│   ├── AuthGuard.vue
│   ├── NotificationCenter.vue
│   ├── ThemeToggle.vue
│   ├── TaskStatusTag.vue
│   ├── QueueIndicator.vue
│   └── CacheIndicator.vue
├── hooks/                # 全局复用
│   ├── useSSE.ts
│   └── useCache.ts       # IndexedDB 封装
├── stores/               # Pinia
│   ├── auth.ts
│   ├── task.ts
│   ├── script.ts
│   ├── notification.ts
│   └── theme.ts
├── views/
│   ├── Auth/             # P0 (4 组件 + 1 hook)
│   ├── Home/             # P1 (3 组件)
│   ├── Import/           # P2 (7 组件 + 3 hooks)
│   ├── Tasks/            # P3 (4 组件 + 1 hook)
│   ├── TaskDetail/       # P4 (4 组件 + 1 hook)
│   ├── ScriptEditor/     # P5 (7 组件 + 4 hooks)
│   └── Schema/           # P6 (4 组件 + 1 hook)
├── api/                  # API 层 (见 API_SPECS)
├── router/
│   └── index.ts
└── utils/
    ├── constants.ts
    └── validators.ts
```

---

## 组件总数

| 类型       | 数量   | 组件                                                                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 全局通用   | 8      | AppLayout, AuthGuard, NotificationCenter, ThemeToggle, TaskStatusTag, QueueIndicator, CacheIndicator, SSEConnector(hook) |
| 全局 hooks | 2      | useSSE, useCache                                                                                                         |
| P0 业务    | 4      | LoginForm, RegisterForm, ResetPwdForm, AuthTabs                                                                          |
| P1 业务    | 3      | ProjectIntro, QuickActions, RecentTaskList                                                                               |
| P2 业务    | 7      | ImportStepper, FileDropZone, TextPasteArea, ChapterDetector, RegexRuleEditor, ChapterPreview, NovelMetaForm              |
| P3 业务    | 4      | TaskTable, TaskStatusFilter, TaskRowActions, RetryDialog                                                                 |
| P4 业务    | 4      | TaskInfoHeader, AgentPipeline, AgentResultPanel, TaskCompleteAction                                                      |
| P5 业务    | 7      | ScriptToolbar, YamlEditor, MarkdownPreview, ExportMenu, PolishDialog, SchemaValidation, VersionHistory                   |
| P6 业务    | 4      | SchemaTree, SchemaFieldTable, SchemaRationale, ScriptExample                                                             |
| **合计**   | **43** | 8 全局 + 35 页面业务                                                                                                     |
