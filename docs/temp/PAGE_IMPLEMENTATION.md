# 页面实现方案 — AI小说转剧本工具

> 基于 COMPONENT_SPECS + API_SPECS 生成 | Vue 3 + Pinia + Element Plus
> 日期: 2026-06-05

---

## 一、路由配置

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/auth",
    name: "Auth",
    component: () => import("@/views/Auth/AuthPage.vue"),
    meta: { title: "登录", guest: true },
  },
  {
    path: "/",
    component: () => import("@/components/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/Home/HomePage.vue"),
        meta: { title: "首页" },
      },
      {
        path: "import",
        name: "Import",
        component: () => import("@/views/Import/ImportPage.vue"),
        meta: { title: "导入小说" },
      },
      {
        path: "tasks",
        name: "Tasks",
        component: () => import("@/views/Tasks/TaskListPage.vue"),
        meta: { title: "分析任务" },
      },
      {
        path: "tasks/:id",
        name: "TaskDetail",
        component: () => import("@/views/TaskDetail/TaskDetailPage.vue"),
        meta: { title: "任务详情" },
        props: true,
      },
      {
        path: "script/:id",
        name: "ScriptEditor",
        component: () => import("@/views/ScriptEditor/ScriptEditorPage.vue"),
        meta: { title: "剧本编辑" },
        props: true,
      },
      {
        path: "schema",
        name: "Schema",
        component: () => import("@/views/Schema/SchemaPage.vue"),
        meta: { title: "YAML Schema" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) return next("/auth");
  if (to.meta.guest && token) return next("/");
  next();
});

export default router;
```

**路由总览**

| 路径          | 页面        | 布局           | 鉴权  |
| ------------- | ----------- | -------------- | ----- |
| `/auth`       | P0 登录注册 | 无布局（独立） | guest |
| `/`           | P1 首页     | AppLayout      | ✅    |
| `/import`     | P2 导入     | AppLayout      | ✅    |
| `/tasks`      | P3 任务列表 | AppLayout      | ✅    |
| `/tasks/:id`  | P4 任务详情 | AppLayout      | ✅    |
| `/script/:id` | P5 剧本编辑 | AppLayout      | ✅    |
| `/schema`     | P6 Schema   | AppLayout      | ✅    |

---

## 二、P0 — 登录注册页

### 目录

```
src/views/Auth/
├── AuthPage.vue              # 页面容器
├── components/
│   ├── AuthTabs.vue
│   ├── LoginForm.vue
│   ├── RegisterForm.vue
│   └── ResetPwdForm.vue
└── hooks/
    └── useAuth.ts
```

### 状态管理

**决策**: 页面本地状态（无需 Store，登录后写入 Pinia auth store）

| 状态               | 类型                           | 默认值    | 存放         |
| ------------------ | ------------------------------ | --------- | ------------ |
| `currentTab`       | `'login'\|'register'\|'reset'` | `'login'` | AuthPage     |
| `loginError`       | `string`                       | `''`      | LoginForm    |
| `accountAvailable` | `boolean\|null`                | `null`    | RegisterForm |
| `resetStep`        | `1\|2`                         | `1`       | ResetPwdForm |

### 数据流

```
AuthPage
  ├─ currentTab ──Props──→ AuthTabs (:active)
  │                        AuthTabs @change → currentTab = tab
  │
  ├─ v-if="login" → LoginForm
  │    @login {account,password}
  │      → POST /api/auth/login
  │        ├─ 200 → authStore.setToken() → router.push('/')
  │        └─ 401 → loginError = "账号或密码错误"
  │
  ├─ v-if="register" → RegisterForm
  │    @check-account → GET /api/auth/register?check=account
  │    @register → POST /api/auth/register
  │      ├─ 201 → Toast → currentTab = 'login'
  │      └─ 409 → accountAvailable = false
  │
  └─ v-if="reset" → ResetPwdForm
       @verify → POST /api/auth/reset-password?check
       @reset → POST /api/auth/reset-password
```

### 容器伪代码

```vue
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/api/auth";

const router = useRouter();
const auth = useAuthStore();
const currentTab = ref("login");

async function handleLogin({ account, password }) {
  const res = await authApi.login({ account, password });
  if (res.code === 0) {
    auth.setToken(res.data.token);
    router.push("/");
  } else {
    /* error handled in LoginForm */
  }
}
</script>
```

### 开发顺序

| 序  | 任务                |
| --- | ------------------- |
| 1   | `api/auth.ts`       |
| 2   | `stores/auth.ts`    |
| 3   | `LoginForm.vue`     |
| 4   | `RegisterForm.vue`  |
| 5   | `ResetPwdForm.vue`  |
| 6   | `AuthTabs.vue`      |
| 7   | 组装 `AuthPage.vue` |

---

## 三、P1 — 项目首页

### 目录

```
src/views/Home/
├── HomePage.vue
└── components/
    ├── ProjectIntro.vue
    ├── QuickActions.vue
    └── RecentTaskList.vue
```

### 状态管理

**决策**: 页面本地 ref（数据量小，无需 Composable）

| 状态          | 类型            | 默认值 | 说明      |
| ------------- | --------------- | ------ | --------- |
| `recentTasks` | `TaskSummary[]` | `[]`   | 最近 5 条 |
| `loading`     | `boolean`       | `true` |           |
| `error`       | `string`        | `''`   |           |

### 数据流

```
HomePage (onMounted → fetchTasks)
  loading=true → Skeleton
    ↓ GET /api/tasks?pageSize=5
  ├─ 200 + data → recentTasks = list → loading=false
  ├─ 200 + empty → empty state
  └─ 网络错误 → error = "加载失败"
  ↓
  Props↓ recentTasks → RecentTaskList
  Emits↑ @view-task → router.push('/tasks/'+id)
  QuickActions @navigate → router.push('/import'|'/tasks')
```

### 生命周期

| 时机              | 动作                        |
| ----------------- | --------------------------- |
| `onMounted`       | GET `/api/tasks?pageSize=5` |
| `onBeforeUnmount` | 无需清理                    |

---

## 四、P2 — 小说导入页

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

### 状态管理

**决策**: Composable `useImportFlow` 封装四步状态机

| 状态         | 类型             | 默认值  | 说明     |
| ------------ | ---------------- | ------- | -------- |
| `step`       | `1\|2\|3\|4`     | `1`     | 当前步骤 |
| `fileInfo`   | `FileInfo\|null` | `null`  | 文件信息 |
| `chapters`   | `Chapter[]`      | `[]`    | 识别结果 |
| `title`      | `string`         | `''`    | 书名     |
| `author`     | `string`         | `''`    | 作者     |
| `submitting` | `boolean`        | `false` | 提交中   |

### 数据流

```
ImportPage
  useImportFlow() → { step, fileInfo, chapters, ... }
  useChapterDetect(text) → { chapters, strategy, hitRate }

  Step 1: FileDropZone @file-ready → fileInfo = data → step=2
  Step 2: ChapterDetector (:text) → chapters → step=3
  Step 3: NovelMetaForm @submit → title, author → step=4

  提交:
    POST /api/novels/import (FormData) → novelId
    POST /api/tasks {novelId} → taskId
    → router.push('/tasks/' + taskId)
```

### 容器伪代码

```vue
<script setup>
import { useImportFlow } from "./hooks/useImportFlow";
import { useChapterDetect } from "./hooks/useChapterDetect";
const { step, fileInfo, title, author, nextStep, submit } = useImportFlow();
const { chapters, strategy, hitRate, detect } = useChapterDetect();

function onFileReady(info) {
  fileInfo.value = info;
  detect(info.text);
  nextStep();
}
function onChaptersConfirm(chs) {
  chapters.value = chs;
  nextStep();
}
function onMetaSubmit({ title: t, author: a }) {
  title.value = t;
  author.value = a;
  nextStep();
}
async function onSubmit() {
  await submit();
} // POST novel → POST task → navigate
</script>
```

### Composable 设计

```ts
// hooks/useImportFlow.ts
export function useImportFlow() {
  const step = ref(1);
  const fileInfo = ref(null);
  const chapters = ref([]);
  const title = ref("");
  const author = ref("");
  const submitting = ref(false);

  async function submit() {
    submitting.value = true;
    const fd = new FormData();
    fd.append("file", fileInfo.value.blob);
    fd.append("title", title.value);
    if (author.value) fd.append("author", author.value);
    const novel = await novelApi.import(fd);
    const task = await taskApi.create(novel.data.id);
    router.push("/tasks/" + task.data.id);
  }

  return { step, fileInfo, chapters, title, author, submitting, submit };
}
```

### 开发顺序

| 序  | 任务                                                                              |
| --- | --------------------------------------------------------------------------------- |
| 1   | `api/novels.ts` + `api/tasks.ts`                                                  |
| 2   | `utils/chapterRegex.ts`                                                           |
| 3   | `hooks/useChapterDetect.ts`                                                       |
| 4   | `hooks/useImportFlow.ts`                                                          |
| 5   | `ImportStepper → FileDropZone → ChapterDetector → ChapterPreview → NovelMetaForm` |
| 6   | 组装 `ImportPage.vue`                                                             |

---

## 五、P3 — 分析任务页

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

### 状态管理

**决策**: Composable `useTaskList`（含 API 调用 + 分页 + 筛选逻辑）

| 状态          | 类型                    | 默认值       | 说明 |
| ------------- | ----------------------- | ------------ | ---- |
| `tasks`       | `TaskSummary[]`         | `[]`         |      |
| `loading`     | `boolean`               | `true`       |      |
| `filters`     | `TaskStatus[]`          | `[]`         | 多选 |
| `pagination`  | `{page,pageSize,total}` | `{1,20,0}`   |      |
| `retryDialog` | `{visible, taskId}`     | `{false,''}` |      |

### 数据流

```
TaskListPage
  useTaskList()
    fetchTasks() → GET /api/tasks?status=&page=&pageSize=
      ├─ 200 → tasks, pagination.total
      └─ 错误 → error

  TaskStatusFilter v-model → filters
    watch(filters) → page=1 → fetchTasks()

  TaskTable @view → router.push('/tasks/'+id)
            @retry → retryDialog.visible = true
            @delete → confirm → DELETE → fetchTasks()

  RetryDialog @confirm {mode} → POST /api/tasks/:id/retry → fetchTasks()
  Pagination @change → page = n → fetchTasks()
```

### Composable 设计

```ts
// hooks/useTaskList.ts
export function useTaskList() {
  const tasks = ref([]);
  const loading = ref(true);
  const filters = ref([]);
  const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

  async function fetchTasks() {
    loading.value = true;
    const res = await taskApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.value.join(",") || undefined,
    });
    tasks.value = res.data.list;
    pagination.total = res.data.total;
    loading.value = false;
  }

  async function retryTask(id, mode) {
    await taskApi.retry(id, mode);
    await fetchTasks();
  }

  async function deleteTask(id) {
    await taskApi.delete(id);
    await fetchTasks();
  }

  watch(
    filters,
    () => {
      pagination.page = 1;
      fetchTasks();
    },
    { deep: true },
  );

  return {
    tasks,
    loading,
    filters,
    pagination,
    fetchTasks,
    retryTask,
    deleteTask,
  };
}
```

---

## 六、P4 — 任务详情页

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

### 状态管理

**决策**: Composable `useTaskDetail`（SSE 流状态管理）

| 状态         | 类型               | 说明                       |
| ------------ | ------------------ | -------------------------- |
| `task`       | `TaskDetail\|null` | 基础信息                   |
| `agents`     | `AgentState[]`     | 8 个 Agent 状态 ← SSE 推入 |
| `taskStatus` | `TaskStatus`       | 派生自 agents              |
| `scriptId`   | `string\|null`     | 完成后返回                 |

### 数据流

```
TaskDetailPage (props: { id })

  onMounted:
    GET /api/tasks/:id → task
    connectSSE(`/api/tasks/:id/stream`)
      ↓ SSE events
      agent:start    → agents[i].status = RUNNING
      agent:progress → agents[i].progress = %
      agent:done     → agents[i].status = DONE
      agent:error    → agents[i].status = FAILED
      task:complete  → scriptId = data.scriptId
    onUnmounted: es.close()

  AgentPipeline (:agents)     ← 纯展示
  AgentResultPanel (:result)  ← 纯展示（折叠面板）
  TaskCompleteAction v-if → [进入剧本编辑] → router.push('/script/'+scriptId)
  RetryActions v-if=failed → [断点重试] / [从头开始]
```

### Composable 设计

```ts
// hooks/useTaskDetail.ts
export function useTaskDetail(taskId: string) {
  const task = ref(null);
  const agents = ref(
    AGENT_NAMES.map((name) => ({
      name,
      status: "PENDING",
      time: null,
      progress: 0,
    })),
  );
  const scriptId = ref(null);

  async function loadTask() {
    const res = await taskApi.getById(taskId);
    task.value = res.data;
    if (res.data.agentResults) {
      res.data.agentResults.forEach((r) => {
        const a = agents.value.find((x) => x.name === r.agentName);
        if (a) {
          a.status = r.status;
          a.time = r.completedAt;
        }
      });
    }
  }

  const { close } = useSSE(`/api/tasks/${taskId}/stream`, {
    "agent:start": (d) => updateAgent(d.agent, "RUNNING"),
    "agent:done": (d) => updateAgent(d.agent, "DONE"),
    "agent:error": (d) => updateAgent(d.agent, "FAILED"),
    "task:complete": (d) => {
      scriptId.value = d.scriptId;
    },
  });

  function updateAgent(name, status) {
    const a = agents.value.find((x) => x.name === name);
    if (a) a.status = status;
  }

  onMounted(() => loadTask());
  onUnmounted(() => close());

  return { task, agents, scriptId };
}
```

---

## 七、P5 — 剧本编辑页

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

### 状态管理

**决策**: 多个 Composable 分工（编辑/版本/润色/校验各自独立）

| Composable          | 职责                | 核心状态                                  |
| ------------------- | ------------------- | ----------------------------------------- |
| `useScriptEditor`   | 剧本加载 + 自动保存 | `content`, `saveStatus`, `currentVersion` |
| `useVersionHistory` | 版本列表 + 回滚     | `versions`, `previewContent`              |
| `usePolish`         | 润色请求 + SSE 跟踪 | `polishStatus`, `style`                   |
| `useSchemaValidate` | YAML Schema 校验    | `errors[]`                                |

### 数据流

```
ScriptEditorPage (props: { id })

  useScriptEditor(id):
    onMounted → GET /api/scripts/:id → content, currentVersion, characters
    编辑变更 (3s防抖) → IndexedDB 自动保存
    编辑变更 (30s防抖) → PUT /api/scripts/:id → currentVersion++

  useSchemaValidate(content, schema):
    watch(content) 或 手动触发 → yamlLint + schemaCheck → errors[]

  PolishDialog @confirm {style, target}:
    usePolish.request(style, target)
      → POST /api/scripts/:id/polish
      → SSE track → 完成后 content = polished → newVersion++

  VersionHistory @rollback {version}:
    POST /api/scripts/:id/rollback {version}
      → content = rolledBack → currentVersion++

  ExportMenu @export {format}:
    format=pdf → GET /api/scripts/:id/export?format=pdf → download
    format=text → 前端直接下载
```

### Composable 设计（核心）

```ts
// hooks/useScriptEditor.ts
export function useScriptEditor(scriptId: string) {
  const content = ref("");
  const currentVersion = ref(1);
  const saveStatus = ref("saved");
  const title = ref("");
  const characters = ref([]);

  let saveTimer: number;

  async function load() {
    const res = await scriptApi.getById(scriptId);
    content.value = res.data.content;
    currentVersion.value = res.data.currentVersion;
    title.value = res.data.title;
    characters.value = res.data.characters;
  }

  // 3s → IndexedDB, 30s → API
  watch(content, () => {
    saveStatus.value = "unsaved";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      saveStatus.value = "saving";
      await saveToIndexedDB(scriptId, content.value);
      const res = await scriptApi.update(scriptId, { content: content.value });
      currentVersion.value = res.data.currentVersion;
      saveStatus.value = "saved";
    }, 30000);
    // 3s IndexedDB
    debouncedIndexedDB(scriptId, content.value);
  });

  onMounted(() => load());

  return { content, currentVersion, saveStatus, title, characters };
}
```

### 生命周期

| 时机              | 动作                                                    |
| ----------------- | ------------------------------------------------------- |
| `onMounted`       | `load()` 剧本 + `loadSchema()`                          |
| `onBeforeUnmount` | 清理 `saveTimer`、关闭 SSE                              |
| 路由离开          | 若 `saveStatus === 'unsaved'` → Dialog "有未保存的更改" |

### 开发顺序

| 序  | 任务                                                                              |
| --- | --------------------------------------------------------------------------------- |
| 1   | `api/scripts.ts` + `api/schema.ts`                                                |
| 2   | `hooks/useCache.ts`（IndexedDB）                                                  |
| 3   | `hooks/useScriptEditor.ts`                                                        |
| 4   | `hooks/useSchemaValidate.ts`                                                      |
| 5   | `hooks/useVersionHistory.ts`                                                      |
| 6   | `hooks/usePolish.ts`                                                              |
| 7   | `utils/yamlToMarkdown.ts`                                                         |
| 8   | `YamlEditor → MarkdownPreview → SchemaValidation → PolishDialog → VersionHistory` |
| 9   | 组装 `ScriptEditorPage.vue`                                                       |

---

## 八、P6 — YAML Schema 文档页

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

### 状态管理

**决策**: 页面本地状态（单一 GET 请求，无需 Composable）

| 状态             | 类型               | 说明               |
| ---------------- | ------------------ | ------------------ |
| `schema`         | `SchemaData\|null` | API 返回的数据     |
| `highlightField` | `string`           | 树节点点击高亮字段 |
| `searchQuery`    | `string`           | 字段搜索           |

### 数据流

```
SchemaPage (onMounted → GET /api/schema)
  → schema = { version, schema, designRationale, example }
  ↓
  SchemaTree (:data=schema.schema) @node-click → highlightField = path
    → SchemaFieldTable (:highlight) 联动高亮
  SchemaRationale (:designRationale) → Markdown 渲染
  ScriptExample (:example) → CodeBlock 展示
```

### 开发顺序

| 序  | 任务                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | `api/schema.ts`                                                   |
| 2   | `SchemaTree → SchemaFieldTable → SchemaRationale → ScriptExample` |
| 3   | 组装 `SchemaPage.vue`                                             |

---

## 九、Pinia Store 详细设计

### auth store

```ts
// src/stores/auth.ts
export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const user = ref(null);

  const isLoggedIn = computed(() => !!token.value);

  function setToken(t: string) {
    token.value = t;
    localStorage.setItem("token", t);
  }
  function logout() {
    token.value = "";
    user.value = null;
    localStorage.removeItem("token");
    router.push("/auth");
  }

  return { token, user, isLoggedIn, setToken, logout };
});
```

### notification store

```ts
// src/stores/notification.ts
export const useNotificationStore = defineStore("notification", () => {
  const messages = ref([]);
  function push(msg: NotificationItem) {
    messages.value.push(msg);
  }
  function shift() {
    return messages.value.shift();
  }
  return { messages, push, shift };
});
```

### theme store

```ts
// src/stores/theme.ts
export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(localStorage.getItem("theme") === "dark");
  function toggle() {
    isDark.value = !isDark.value;
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  }
  return { isDark, toggle };
});
```

---

## 十、全局开发顺序

| 阶段            | 任务                | 包含                                                       |
| --------------- | ------------------- | ---------------------------------------------------------- |
| **1. 脚手架**   | 项目初始化          | Vite + Vue3 + TS + Element Plus + Pinia + Router           |
| **2. API 层**   | `src/api/` 全部模块 | request.ts → auth/novels/tasks/scripts/schema              |
| **3. Store**    | Pinia 初始化        | auth + notification + theme                                |
| **4. 全局组件** | `src/components/`   | AppLayout, AuthGuard, NotificationCenter, TaskStatusTag... |
| **5. P0**       | 登录注册            | AuthPage + 4 子组件                                        |
| **6. P1**       | 首页                | HomePage + 3 子组件                                        |
| **7. P2**       | 导入页              | ImportPage + 7 子组件 + 3 hooks                            |
| **8. P3**       | 任务列表            | TaskListPage + useTaskList                                 |
| **9. P4**       | 任务详情            | TaskDetailPage + SSE                                       |
| **10. P5**      | 剧本编辑            | ScriptEditorPage + 7 组件 + 4 hooks（最复杂）              |
| **11. P6**      | Schema 文档         | SchemaPage + 4 子组件                                      |
| **12. 联调**    | 端到端测试          | 全流程走通                                                 |

---

## 十一、全局数据流

```
┌─────────────────────────────────────────────┐
│                  Pinia Stores                │
│  auth ──token──→ axios interceptor           │
│  notification ←── SSE / API 完成事件          │
│  theme ──→ document.documentElement.class    │
│  task ←── SSE 写入 (P4 消费)                 │
│  script ←── 编辑器自动保存状态                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│               API Layer (src/api/)           │
│  request.ts ── token注入 + 401跳转 + 解包     │
│  auth.ts / novels.ts / tasks.ts ...          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Views (src/views/)                 │
│  P0 ──→ P1 ──→ P2 ──→ P3/P4 ──→ P5          │
│              (P6 独立入口)                    │
└─────────────────────────────────────────────┘
```
