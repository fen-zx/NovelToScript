# Frontend Architecture — AI小说转剧本工具

> 基于 PAGE_IMPLEMENTATION + COMPONENT_SPECS + API_SPECS
> 技术栈: Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router
> 日期: 2026-06-05

---

## 一、项目结构

```
novel-to-script/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.ts                      # 应用入口
│   ├── App.vue                      # 根组件（theme + router-view）
│   │
│   ├── api/                         # API 层（集中管理所有 HTTP 请求）
│   │   ├── request.ts               # Axios 实例 + 拦截器
│   │   ├── auth.ts                  # A0a/A0b/A0c
│   │   ├── novels.ts                # A1
│   │   ├── tasks.ts                 # A2/A3/A4/A10
│   │   ├── tasksSSE.ts              # A5 SSE 封装
│   │   ├── scripts.ts               # A6/A7/A8/A11/A12/A13/A14
│   │   └── schema.ts                # A9
│   │
│   ├── stores/                      # Pinia（客户端状态）
│   │   ├── auth.ts                  # 认证状态
│   │   ├── notification.ts          # 消息通知队列
│   │   └── theme.ts                 # 暗色/亮色主题
│   │
│   ├── router/
│   │   └── index.ts                 # 路由配置 + AuthGuard
│   │
│   ├── components/                  # 全局通用组件
│   │   ├── AppLayout.vue            # 桌面端布局（侧边栏+顶栏）
│   │   ├── AppLayoutMobile.vue      # 移动端布局（底部Tab+抽屉）
│   │   ├── NotificationCenter.vue   # 消息通知弹窗
│   │   ├── ThemeToggle.vue          # 主题切换按钮
│   │   ├── TaskStatusTag.vue        # 任务状态标签
│   │   ├── QueueIndicator.vue       # 队列状态指示
│   │   └── CacheIndicator.vue       # 离线缓存指示
│   │
│   ├── hooks/                       # 全局复用 Composable
│   │   ├── useSSE.ts                # SSE 连接管理
│   │   └── useCache.ts              # IndexedDB 封装
│   │
│   ├── views/                       # 页面（按路由分组）
│   │   ├── Auth/                    # P0 登录注册
│   │   │   ├── AuthPage.vue
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── Home/                    # P1 首页
│   │   ├── Import/                  # P2 导入
│   │   ├── Tasks/                   # P3 任务列表
│   │   ├── TaskDetail/              # P4 任务详情
│   │   ├── ScriptEditor/            # P5 剧本编辑
│   │   └── Schema/                  # P6 Schema 文档
│   │
│   ├── types/                       # 全局类型定义
│   │   ├── api.ts                   # API 响应类型
│   │   ├── task.ts                  # Task/TaskStatus 等
│   │   ├── script.ts                # Script/Version 等
│   │   └── novel.ts                 # Novel/Chapter 等
│   │
│   ├── utils/
│   │   ├── constants.ts             # 枚举映射、润色风格列表等
│   │   └── validators.ts            # 通用校验函数
│   │
│   └── assets/
│       └── styles/
│           ├── variables.css        # CSS 变量（毛玻璃主题）
│           └── global.css           # 全局样式
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
└── .env
```

---

## 二、组件分层

```
components/
├── ui/                              # Element Plus 二次封装（本项目暂不需要）
│   └── (直接使用 el-button, el-input 等)
│
├── global/                           # 全局通用组件（跨页面复用）
│   ├── AppLayout.vue                # 桌面端布局
│   ├── AppLayoutMobile.vue          # 移动端布局
│   ├── NotificationCenter.vue
│   ├── ThemeToggle.vue
│   ├── TaskStatusTag.vue
│   ├── QueueIndicator.vue
│   └── CacheIndicator.vue
│
└── views/{Page}/components/         # 页面业务组件（仅本页使用）
    ├── Auth/   (4 组件)
    ├── Home/   (3 组件)
    ├── Import/ (7 组件)
    ├── Tasks/  (4 组件)
    ├── TaskDetail/ (4 组件)
    ├── ScriptEditor/ (7 组件)
    └── Schema/ (4 组件)
```

| 分层         | 特征                           | 位置                           | 数量 |
| ------------ | ------------------------------ | ------------------------------ | ---- |
| **UI 组件**  | 纯展示，Props 驱动，无业务逻辑 | Element Plus 内置              | —    |
| **全局组件** | 跨页面复用，有业务含义         | `src/components/`              | 7    |
| **页面组件** | 单一页面使用，含业务逻辑       | `src/views/{Page}/components/` | 33   |

---

## 三、页面架构

| 页面                    | 文件                                      | 职责                          | 禁止                 |
| ----------------------- | ----------------------------------------- | ----------------------------- | -------------------- |
| **P0 AuthPage**         | `views/Auth/AuthPage.vue`                 | Tab 切换管理、API 调用编排    | 直接操作 DOM         |
| **P1 HomePage**         | `views/Home/HomePage.vue`                 | 加载最近任务、路由跳转        | 复杂业务逻辑         |
| **P2 ImportPage**       | `views/Import/ImportPage.vue`             | 四步状态机驱动、章节识别编排  | 直接调用正则引擎     |
| **P3 TaskListPage**     | `views/Tasks/TaskListPage.vue`            | 列表+筛选+分页编排            | 直接 axios           |
| **P4 TaskDetailPage**   | `views/TaskDetail/TaskDetailPage.vue`     | SSE 连接管理、中间结果展示    | 直接操作 EventSource |
| **P5 ScriptEditorPage** | `views/ScriptEditor/ScriptEditorPage.vue` | 编辑器+预览同步、自动保存编排 | 直接操作 Monaco API  |
| **P6 SchemaPage**       | `views/Schema/SchemaPage.vue`             | Schema 加载、树表格联动       | 复杂交互逻辑         |

**页面职责原则**:

- 页面容器只做"编排"：组合子组件 + 传递 Props + 响应 Emits
- 复杂逻辑抽取到 `hooks/` Composable
- API 调用通过 `src/api/` 模块，不直接 axios

---

## 四、路由设计

```
/auth                           → AuthPage (guest, 无布局)
/                               → AppLayout (requiresAuth)
  ├─ /                          → HomePage
  ├─ /import                    → ImportPage
  ├─ /tasks                     → TaskListPage
  ├─ /tasks/:id                 → TaskDetailPage
  ├─ /script/:id                → ScriptEditorPage
  └─ /schema                    → SchemaPage
```

**路由守卫逻辑**:

```
用户访问任意路径
        ↓
   ┌─ meta.requiresAuth && !token → 跳转 /auth
   ├─ meta.guest && token         → 跳转 /
   └─ 其他                          → 放行
```

**路由 Meta 约定**:

| meta 字段      | 类型      | 说明                       |
| -------------- | --------- | -------------------------- |
| `title`        | `string`  | 页面标题（document.title） |
| `requiresAuth` | `boolean` | 需要登录                   |
| `guest`        | `boolean` | 仅未登录可访问             |

---

## 五、状态管理架构

### 状态分类

| 状态类型            | 方案                 | 存储                 | 示例                         |
| ------------------- | -------------------- | -------------------- | ---------------------------- |
| **Server State**    | Composable 内 ref    | 组件/Composable      | 任务列表、剧本内容、版本列表 |
| **Client State**    | Pinia Store          | Pinia + localStorage | 认证 token、主题、通知队列   |
| **UI State**        | 组件内 ref/reactive  | 组件自身             | 弹窗显隐、表单值、展开/折叠  |
| **持久化 UI State** | Pinia + localStorage | Pinia persist        | 暗色模式、语言偏好           |

### Pinia Store 设计

```
stores/
├── auth.ts            # useAuthStore
│   token, user, isLoggedIn
│   setToken(), logout()
│
├── notification.ts    # useNotificationStore
│   messages[]
│   push(), shift()
│
└── theme.ts           # useThemeStore
    isDark
    toggle()
```

### Server State 管理（Composable 模式）

本项目不使用 TanStack Query，而是通过 Composable 模式管理 Server State：

```ts
// 模式：每个数据域一个 Composable
// hooks/useTaskList.ts
export function useTaskList() {
  const tasks = ref([]);
  const loading = ref(true);
  const error = ref(null);

  async function fetch() {
    /* API 调用 */
  }
  async function refresh() {
    /* 失效重取 */
  }

  return { tasks, loading, error, fetch, refresh };
}
```

**Server State Composable 清单**:

| Composable          | 管理数据                     | API           |
| ------------------- | ---------------------------- | ------------- |
| `useTaskList`       | tasks[], pagination, filters | A3, A10       |
| `useTaskDetail`     | task, agents[], scriptId     | A4, A5(SSE)   |
| `useScriptEditor`   | content, saveStatus, version | A6, A7        |
| `useVersionHistory` | versions[], previewContent   | A11, A12, A13 |
| `usePolish`         | polishStatus                 | A8            |
| `useSchema`         | schema data                  | A9            |

### 状态流原则

```
1. API → Composable ref → 组件 Props↓
2. 组件交互 → Emits↑ → 页面容器 → Composable 方法 → API
3. 跨组件共享 → Pinia Store（仅 token/theme/notification）
4. 组件内部 UI 状态不暴露给父组件
```

---

## 六、API 层设计

```
api/
├── request.ts          # Axios 实例 — 唯一 HTTP 入口
├── auth.ts             # authApi.register/login/resetPassword
├── novels.ts           # novelApi.import
├── tasks.ts            # taskApi.create/list/getById/retry/delete
├── tasksSSE.ts         # connectTaskSSE(taskId, handlers)
├── scripts.ts          # scriptApi.getById/update/polish/versions/rollback/export
└── schema.ts           # schemaApi.get
```

### request.ts 核心设计

```ts
import axios from "axios";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  timeout: 30000,
});

// 请求拦截: JWT 注入
request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截: 统一解包 + 401 跳转
request.interceptors.response.use(
  (res) => res.data, // 解包 → { code, message, data }
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  },
);
```

### API 模块规范

- 所有 HTTP 请求通过 `src/api/` 模块调用，**禁止页面直接 axios**
- 每个模块导出以 `Api` 后缀命名的对象（如 `authApi`, `taskApi`）
- SSE 连接单独封装为 `connectTaskSSE()` 函数

---

## 七、Hook 架构

### 分类

| 类型              | 位置                                        | 示例                                   |
| ----------------- | ------------------------------------------- | -------------------------------------- |
| **Query Hook**    | `views/{Page}/hooks/`                       | `useTaskList.ts`, `useScriptEditor.ts` |
| **Mutation Hook** | `views/{Page}/hooks/`                       | `usePolish.ts`                         |
| **UI Hook**       | `src/hooks/`（全局）/ `views/{Page}/hooks/` | `useSSE.ts`, `useCache.ts`             |

### 全局 Hooks

```
src/hooks/
├── useSSE.ts        # SSE 连接 + 自动重连 + 心跳
└── useCache.ts      # IndexedDB 读写封装
```

### 页面 Hooks

| Hook                | 页面 | 类型          | 职责             |
| ------------------- | ---- | ------------- | ---------------- |
| `useAuth`           | P0   | Mutation      | 登录/注册/登出   |
| `useFileImport`     | P2   | Mutation      | 文件上传+粘贴    |
| `useChapterDetect`  | P2   | Query         | 章节识别引擎     |
| `useImportFlow`     | P2   | State Machine | 四步导入状态机   |
| `useTaskList`       | P3   | Query         | 列表+筛选+分页   |
| `useTaskDetail`     | P4   | Query+SSE     | 任务详情+流水线  |
| `useScriptEditor`   | P5   | Query         | 加载+自动保存    |
| `useVersionHistory` | P5   | Query         | 版本列表+回滚    |
| `usePolish`         | P5   | Mutation+SSE  | 润色请求+跟踪    |
| `useSchemaValidate` | P5   | UI            | YAML Schema 校验 |
| `useSchema`         | P6   | Query         | Schema 数据加载  |

### Hook 命名规范

- 数据查询: `use{Entity}` 或 `use{Entity}List`
- 数据变更: `use{Action}` 如 `usePolish`, `useImport`
- UI 状态: `use{Feature}` 如 `useSSE`, `useCache`

---

## 八、数据流设计

```
┌──────────────────────────────────────────────┐
│                  API Layer                    │
│  src/api/*.ts  (authApi, taskApi, ...)        │
│  所有 HTTP 请求的唯一入口                       │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│           Composable Hooks                    │
│  useTaskList / useScriptEditor / ...          │
│  管理 Server State (loading/error/data)        │
│  封装 API 调用 + 竞态处理 + 缓存               │
└────────────────────┬─────────────────────────┘
                     │ Props↓
┌────────────────────▼─────────────────────────┐
│            Page Container                     │
│  AuthPage / HomePage / ImportPage / ...       │
│  编排子组件 + 路由跳转                          │
└──────┬──────────┬──────────┬─────────────────┘
       │ Props↓   │ Props↓   │ Props↓
  ┌────▼───┐ ┌───▼────┐ ┌──▼────────┐
  │ Child  │ │ Child  │ │ Child     │
  │ Comp A │ │ Comp B │ │ Comp C    │
  └────┬───┘ └───┬────┘ └────┬──────┘
       │ Emit↑   │ Emit↑     │ Emit↑
       └─────────┴───────────┘
        回到 Page → Composable 方法 → API
```

### 禁止的反模式

```
❌ 页面组件直接 axios.get()
❌ API 数据存入 Pinia Store
❌ 子组件修改 Props
❌ 跨层级传递事件（应逐级 Emit）
```

---

## 九、权限架构

### 角色

| 角色              | 权限                       |
| ----------------- | -------------------------- |
| **Author** (默认) | 管理自己的小说、任务、剧本 |
| **Admin**         | 管理所有用户数据           |

### 路由权限

| 路由         | 权限要求               |
| ------------ | ---------------------- |
| `/auth`      | guest（未登录）        |
| 其他所有路由 | requiresAuth（已登录） |

### 组件级权限

| 组件          | 条件                             |
| ------------- | -------------------------------- |
| 编辑/删除操作 | `task.userId === currentUser.id` |
| 队列满提示    | `queuedCount >= 3`               |

### AuthGuard 实现

```ts
// router/index.ts — beforeEach
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) return next("/auth");
  if (to.meta.guest && token) return next("/");
  next();
});
```

---

## 十、表单架构

本项目使用 **Element Plus 内置表单校验**，不引入额外表单库。

### 表单组件分类

| 表单          | 页面 | 字段数 | 校验规则                           |
| ------------- | ---- | ------ | ---------------------------------- |
| LoginForm     | P0   | 2      | 账号必填、密码≥6位                 |
| RegisterForm  | P0   | 3      | 用户名2-20字、账号唯一性、密码≥6位 |
| ResetPwdForm  | P0   | 2      | 用户名必填、新密码≥6位             |
| NovelMetaForm | P2   | 2      | 书名必填                           |
| PolishDialog  | P5   | 2      | 风格必选、范围选填                 |

### 统一模式

```vue
<el-form :model="form" :rules="rules" ref="formRef">
  <el-form-item prop="account" label="账号">
    <el-input v-model="form.account" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="submitForm">提交</el-button>
  </el-form-item>
</el-form>

<script setup>
const rules = {
  account: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [
    { required: true, min: 6, message: "密码至少6位", trigger: "blur" },
  ],
};
</script>
```

---

## 十一、错误处理策略

### 三层错误处理

| 层级     | 机制                 | 示例                         |
| -------- | -------------------- | ---------------------------- |
| **全局** | axios 响应拦截器     | 401 → 跳转登录, 500 → Toast  |
| **页面** | Composable error ref | 网络错误 → "加载失败 [重试]" |
| **组件** | 表单校验             | 字段标红 + message           |

### 三态覆盖

每个数据加载场景必须处理：

```
Loading  → Element Plus Skeleton / v-loading
Empty    → 空状态插画 + 引导文案
Error    → 错误提示 + [重试] 按钮
```

### 全局错误边界

```vue
<!-- App.vue -->
<template>
  <router-view v-slot="{ Component }">
    <error-boundary>
      <component :is="Component" />
    </error-boundary>
  </router-view>
</template>
```

---

## 十二、文件上传架构

### 上传流程

```
FileDropZone → 前端校验 → useFileImport → POST /api/novels/import
                ├─ 格式校验 (.txt/.docx/.md)
                ├─ 大小校验 (≤20MB)
                └─ MIME 校验
```

### 组件设计

| 组件            | 职责                    |
| --------------- | ----------------------- |
| `FileDropZone`  | 拖拽/点击UI + 前端校验  |
| `TextPasteArea` | 文本粘贴输入 + 字数统计 |

### 上传安全

- `accept=".txt,.docx,.md"` 限制文件选择器
- `beforeUpload` 钩子校验格式和大小
- 上传进度通过 `onUploadProgress` 回调

---

## 十三、AI 项目特殊设计

本项目涉及 AI Agent 流水线，需要特殊处理：

### SSE 长连接管理

```
useSSE(url, handlers)
  ├─ EventSource 连接
  ├─ 自动重连 (2s → 4s → 8s，最多 3 次)
  ├─ 心跳检测 (30s 无消息 → 视为断线)
  └─ onUnmounted 自动关闭
```

### 流式内容展示

| 组件                 | SSE 事件               | 渲染方式                 |
| -------------------- | ---------------------- | ------------------------ |
| `AgentPipeline`      | agent:start/done/error | 7 阶段 Timeline 状态更新 |
| `AgentResultPanel`   | agent:done 后          | 折叠面板展开 JSON        |
| `TaskCompleteAction` | task:complete          | 激活"进入编辑"按钮       |

### 编辑器自动保存

```
内容变更
  ├─ 3s 防抖 → IndexedDB (一级缓存)
  └─ 30s 防抖 → PUT /api/scripts/:id (二级缓存)
```

---

## 十四、性能优化建议

| #   | 建议                   | 适用场景                              |
| --- | ---------------------- | ------------------------------------- |
| 1   | Monaco Editor 延迟加载 | P5 剧本编辑页（首次打开时加载）       |
| 2   | TaskTable 虚拟滚动     | P3 任务列表（数据 >100 条时）         |
| 3   | 路由懒加载（已实现）   | 所有页面 `() => import(...)`          |
| 4   | 组件按需渲染           | P0 AuthPage 三个表单 `v-if` 切换      |
| 5   | SSE 按需连接           | P4 仅在页面挂载时建立连接             |
| 6   | 大对象避免放 Pinia     | 剧本内容存 Composable ref，不入 Store |

---

## 十五、工程规范

### 代码规范

| 工具       | 用途       |
| ---------- | ---------- |
| ESLint     | 代码质量   |
| Prettier   | 代码格式化 |
| TypeScript | 类型安全   |

### 命名规范

| 类型        | 规范                      | 示例                             |
| ----------- | ------------------------- | -------------------------------- |
| 页面组件    | PascalCase + `Page` 后缀  | `AuthPage.vue`, `HomePage.vue`   |
| 业务组件    | PascalCase                | `LoginForm.vue`, `TaskTable.vue` |
| Composable  | `use` 前缀 + camelCase    | `useTaskList.ts`, `useSSE.ts`    |
| Pinia Store | `use` 前缀 + `Store` 后缀 | `useAuthStore.ts`                |
| API 模块    | 小写 + `.api` 后缀        | `auth.ts`, `tasks.ts`            |
| 类型文件    | 小写                      | `task.ts`, `script.ts`           |
| Props       | camelCase                 | `:taskId`, `:loading`            |
| Emits       | kebab-case                | `@view-task`, `@file-ready`      |

### 文件命名

```
script.api.ts        # API 模块
useScriptEditor.ts   # Composable
ScriptEditorPage.vue # 页面
YamlEditor.vue       # 组件
```

### 导入顺序

```ts
// 1. Vue 核心
import { ref, computed, onMounted } from "vue";

// 2. 第三方库
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

// 3. 内部模块
import { scriptApi } from "@/api/scripts";
import { useAuthStore } from "@/stores/auth";

// 4. 本页组件
import YamlEditor from "./components/YamlEditor.vue";
```

---

## 十六、推荐目录（完整）

```
src/
├── main.ts
├── App.vue
│
├── api/                    # API 层
│   ├── request.ts          # Axios 实例
│   ├── auth.ts
│   ├── novels.ts
│   ├── tasks.ts
│   ├── tasksSSE.ts
│   ├── scripts.ts
│   └── schema.ts
│
├── stores/                 # Pinia
│   ├── auth.ts
│   ├── notification.ts
│   └── theme.ts
│
├── router/
│   └── index.ts
│
├── components/             # 全局组件
│   ├── AppLayout.vue
│   ├── AppLayoutMobile.vue
│   ├── NotificationCenter.vue
│   ├── ThemeToggle.vue
│   ├── TaskStatusTag.vue
│   ├── QueueIndicator.vue
│   └── CacheIndicator.vue
│
├── hooks/                  # 全局 Hooks
│   ├── useSSE.ts
│   └── useCache.ts
│
├── views/                  # 页面
│   ├── Auth/
│   ├── Home/
│   ├── Import/
│   ├── Tasks/
│   ├── TaskDetail/
│   ├── ScriptEditor/
│   └── Schema/
│
├── types/                  # 类型
│   ├── api.ts
│   ├── task.ts
│   ├── script.ts
│   └── novel.ts
│
├── utils/
│   ├── constants.ts
│   └── validators.ts
│
└── assets/
    └── styles/
        ├── variables.css
        └── global.css
```

### 组件总数

| 层级     | 数量   |
| -------- | ------ |
| 全局组件 | 7      |
| P0 组件  | 4      |
| P1 组件  | 3      |
| P2 组件  | 7      |
| P3 组件  | 4      |
| P4 组件  | 4      |
| P5 组件  | 7      |
| P6 组件  | 4      |
| **总计** | **40** |
