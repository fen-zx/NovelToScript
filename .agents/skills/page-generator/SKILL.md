---
name: page-generator
description: '根据组件树和设计文档生成完整页面实现方案。用于 Vue/React 前端页面开发前的结构设计，涵盖目录结构、状态管理、数据流、API 层、路由配置。上游对接 component-generator，输出可直接用于编码的页面蓝图。'
argument-hint: '[组件树 / PAGE_SPECS / 原型说明]'
user-invocable: true
---

# 页面生成器（PageGenerator）

## 目标

将 ComponentGenerator 的组件接口方案转化为完整的页面实现蓝图——目录结构、状态管理选型、数据流设计、API 层规划、路由配置——让开发者拿到就能直接开始写代码。

## 何时使用

- 组件拆分完成，准备开始写页面
- 需要决策状态管理方案（ref vs reactive vs Vuex vs Composable）
- AI 代码生成前，需要一份精确的页面蓝图作为 Prompt 上下文
- 页面重构时评估现有架构

## 输入

| 来源 | 格式 | 提供内容 |
|------|------|----------|
| ComponentGenerator 输出 | Markdown | 组件树 + Props/Emits + 状态方案 |
| DesignGenerator 输出 | Markdown PAGE_SPECS | 数据来源（API 接口） |
| LowFiPrototypeGenerator 输出 | Markdown | 交互流程 + 状态矩阵 |

## 输出格式

```markdown
# 页面实现方案：{页面名称}

## 页面职责
{一句话描述该页面的核心业务使命}

---

## 目录结构

```
src/views/UserManagement/
├── UserManagementPage.vue         # 页面容器（状态枢纽）
├── components/
│   ├── SearchForm.vue             # 搜索表单
│   ├── UserTable.vue              # 用户表格
│   └── EditUserModal.vue          # 编辑弹窗
├── hooks/
│   └── useUserList.js             # 列表逻辑 Composable
└── types/
    └── user.ts                    # 类型定义（TS 项目）
```

### 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `UserManagementPage.vue` | 页面容器 | 状态管理 + 布局编排 + API 调用 |
| `components/SearchForm.vue` | 业务组件 | 搜索表单，自治状态 |
| `components/UserTable.vue` | 业务组件 | 纯展示，Props 驱动 |
| `components/EditUserModal.vue` | 业务组件 | 弹窗表单，内置校验 |
| `hooks/useUserList.js` | Composable | 列表 CRUD 逻辑复用 |
| `types/user.ts` | 类型 | User 接口定义 |

---

## 状态管理设计

### 决策：页面本地状态（无需 Vuex Store）

> 理由：本页面的 users / filters / pagination 不需跨页面共享，用 Composable 封装即可。

### 状态表

| 状态名 | 类型 | 初始值 | 存放位置 | 说明 |
|--------|------|--------|----------|------|
| `users` | `User[]` | `[]` | Composable | 当前页用户数据 |
| `loading` | `boolean` | `false` | Composable | 列表加载态 |
| `filters` | `{ name, status }` | `{ name:'', status:'' }` | Composable | 搜索条件 |
| `pagination` | `{ current, pageSize, total }` | `{ current:1, pageSize:20, total:0 }` | Composable | 分页信息 |
| `modalVisible` | `boolean` | `false` | 页面容器 | 编辑弹窗显隐 |
| `editingUser` | `User \| null` | `null` | 页面容器 | 当前编辑的用户 |

### 数据流

```
┌─────────────────────────────────────────────────────┐
│                 UserManagementPage                   │
│                                                     │
│  useUserList()  ←── Composable 提供状态 + 方法       │
│  ┌──────────────────────────────────────────┐       │
│  │ users, loading, filters, pagination       │       │
│  │ fetchUsers(), search(), changePage()      │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  页面容器额外管理：                                    │
│  modalVisible, editingUser                          │
│                                                     │
│  ┌───────────┐  ┌──────────┐  ┌───────────────┐    │
│  │SearchForm │  │UserTable │  │EditUserModal   │    │
│  │           │  │          │  │                │    │
│  │@search───►│  │◄─users──│  │◄─visible       │    │
│  │           │  │          │  │◄─user          │    │
│  │           │  │@edit────►│  │@saved─────────►│    │
│  │           │  │@delete──►│  │@close─────────►│    │
│  └───────────┘  └──────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 状态流（以搜索为例）

```
SearchForm @search { name, status }
        ↓
页面容器 handleSearch(params)
        ↓
filters.name = params.name
filters.status = params.status
pagination.current = 1        ← 搜索时重置页码
        ↓
fetchUsers()
        ↓
GET /api/users?name=&status=&page=1
        ↓
   ┌─ 成功 → users = res.data.list, pagination.total = res.data.total
   └─ 失败 → Toast "加载失败"
```

---

## API 层设计

### 接口清单

| 方法 | 路径 | 说明 | 页面状态影响 |
|------|------|------|-------------|
| `GET` | `/api/users` | 获取用户列表 | `loading` / `users` / `pagination` |
| `PUT` | `/api/users/:id` | 更新用户 | `loading`(弹窗内) |
| `DELETE` | `/api/users/:id` | 删除用户 | 刷新列表 |

### 请求参数

```
GET /api/users
  ?name={string}      // 姓名模糊搜索
  &status={string}    // 状态筛选：''=全部, 'active'=启用, 'disabled'=禁用
  &page={number}      // 页码，从 1 开始
  &pageSize={number}  // 每页条数，默认 20
```

### 响应结构

```json
{
  "code": 0,
  "data": {
    "list": [
      { "id": 1, "name": "张三", "email": "zhang@example.com", "status": "active", "createdAt": "2026-01-01" }
    ],
    "total": 200,
    "page": 1,
    "pageSize": 20
  }
}
```

### API 文件位置

```
src/api/user.js    ← 新建，或在 src/api/api.js 中追加
```

---

## 路由配置

```js
// src/router/index.js
{
  path: '/user-management',
  name: 'UserManagement',
  component: () => import('@/views/UserManagement/UserManagementPage.vue'),
  meta: { title: '用户管理', requiresAuth: true }
}
```

---

## 生命周期设计

| 时机 | 动作 |
|------|------|
| `onMounted` | 调用 `fetchUsers()` 加载首页数据 |
| `onBeforeUnmount` | 无需清理（无定时器/订阅） |
| 路由离开守卫 | 若有未保存编辑 → 弹窗确认 |

---

## 页面容器伪代码结构

```vue
<!-- UserManagementPage.vue -->
<script setup>
import { ref } from 'vue'
import { useUserList } from './hooks/useUserList'
import SearchForm from './components/SearchForm.vue'
import UserTable from './components/UserTable.vue'
import EditUserModal from './components/EditUserModal.vue'

// ── Composable ──
const { users, loading, filters, pagination, fetchUsers, search, changePage } = useUserList()

// ── 弹窗状态 ──
const modalVisible = ref(false)
const editingUser = ref(null)

// ── 事件处理 ──
const handleSearch = (params) => search(params)
const handleEdit = (user) => { editingUser.value = user; modalVisible.value = true }
const handleDelete = (user) => { /* 确认框 → API → 刷新 */ }
const handleSaved = () => { modalVisible.value = false; fetchUsers() }
const handlePageChange = (page) => changePage(page)

// ── 初始化 ──
fetchUsers()
</script>
```

---

## 与现有项目的集成

| 项目资源 | 使用方式 |
|----------|----------|
| `src/store/` (Vuex) | 本页面无需 store；若后续需跨页面共享用户数据，在 `store/modules/` 新增 `user.js` |
| `src/router/index.js` | 追加路由配置 |
| `src/api/api.js` / `src/api/axios.js` | 复用 axios 实例，在 `src/api/` 下新增 `user.js` |
| `src/components/HintModal.vue` | EditUserModal 可考虑继承或参考其模式 |

---

## 开发顺序建议

| 序号 | 任务 | 预估 |
|------|------|------|
| 1 | 创建 `src/api/user.js`，封装接口 | 15 min |
| 2 | 创建 `hooks/useUserList.js` Composable | 30 min |
| 3 | 创建 `SearchForm.vue`（自治组件） | 20 min |
| 4 | 创建 `UserTable.vue`（Props 驱动） | 20 min |
| 5 | 创建 `EditUserModal.vue`（弹窗+校验） | 25 min |
| 6 | 组装 `UserManagementPage.vue` 容器 | 20 min |
| 7 | 添加路由配置 | 5 min |
| 8 | 联调 + 状态测试 | 15 min |
```

---

## 生成规则

### 目录结构
1. 页面容器放 `src/views/{PageName}/`，子组件放 `components/` 子目录
2. 可复用逻辑抽取为 `hooks/use*.js`（Vue3 Composable）
3. TypeScript 项目加 `types/` 目录
4. 遵循项目现有约定（本项目用 `src/api/` 而非 `services/`）

### 状态管理选型决策树

```
状态是否需要跨页面共享？
  ├─ 是 → 是否需要持久化？
  │        ├─ 是 → Vuex/Pinia + localStorage plugin
  │        └─ 否 → Vuex/Pinia module
  └─ 否 → 状态逻辑是否复杂（>3 个 API 调用 / >5 个状态字段）？
           ├─ 是 → Composable (hooks/use*.js)
           └─ 否 → 页面容器内 ref/reactive
```

### API 层设计
1. 从 DesignGenerator 的"数据来源"映射提取接口
2. 为每个接口定义：方法、路径、查询参数、响应结构
3. 标注每个接口触发的状态变化
4. 文件位置遵循项目已有 `src/api/` 结构

### 数据流设计
1. 用 ASCII 图标注组件间 Props↓ Emits↑ 方向
2. 为每个核心操作画一条"触发→处理→分支→UI 响应"的状态流
3. 覆盖正常流 + 异常流

---

## 工作步骤

1. **解析组件树**：提取页面容器和所有子组件、Props/Emits 关系
2. **决策状态方案**：按决策树选择 ref / Composable / Vuex
3. **绘制数据流**：画 Props↓ Emits↑ 图 + 每个操作的时序流
4. **设计 API 层**：列出接口清单、参数、响应结构、状态映射
5. **规划目录结构**：给出文件清单和创建顺序
6. **配置路由**：给出路由配置代码片段
7. **输出容器伪代码**：展示页面容器如何串联所有组件
8. **给出开发顺序**：按依赖关系排列实施步骤

---

## 示例

### 输入（来自 ComponentGenerator）

```
组件树:
UserManagementPage
├── SearchForm (@search, @reset)
├── UserTable (users, loading → @edit, @delete)
├── Pagination (current, total → @change)
└── EditUserModal (visible, user → @saved, @close)

API: GET /api/users, PUT /api/users/:id, DELETE /api/users/:id
```

### 输出

（见上方「输出格式」中的完整方案）

---

## 注意事项

- **禁止直接生成业务代码**：输出蓝图而非 `.vue` 文件内容（伪代码仅示意结构）
- **遵循项目约定**：API 放 `src/api/`、页面放 `src/views/`、路由放 `src/router/`、Store 放 `src/store/`
- **状态管理从简**：能用 ref 解决的不用 Composable，能用 Composable 的不用 Vuex
- **API 层必须定义响应结构**：不只写路径，要写明返回的 JSON 结构
- **开发顺序要按依赖排列**：API 层 → Composable → 子组件 → 页面容器 → 路由
- 与 `component-generator` 输出严格对应，逐组件映射到目录文件
