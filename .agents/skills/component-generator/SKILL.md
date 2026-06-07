---
name: component-generator
description: '根据页面规格和原型说明生成前端组件设计方案。用于组件拆分、Props/Emits/Slots 接口设计、状态管理（Vuex/Pinia/Composable）规划及代码生成前准备。上游对接 lowfi-prototype-generator 和 layout-optimizer，输出组件树 + 接口定义 + 目录建议。'
argument-hint: '[PAGE_SPECS / 原型说明 / 页面设计]'
user-invocable: true
---

# 组件生成器（ComponentGenerator）

## 目标

将页面原型说明转化为可直接编码的前端组件设计方案：组件树、Props/Emits/Slots 接口、状态归属、文件目录建议。这是从"设计"到"代码"的最后一步中间层。

## 何时使用

- 页面原型确认后，准备开始编码
- 需要明确每个组件的输入（Props）和输出（Emits），便于并行开发
- 重构时评估现有组件拆分是否合理
- 建设组件库时，为通用组件定义标准接口

## 输入

| 来源 | 格式 | 提供内容 |
|------|------|----------|
| LowFiPrototypeGenerator 输出 | Markdown 原型说明 | 组件清单 + 交互流程 + 状态矩阵 |
| DesignGenerator 输出 | Markdown PAGE_SPECS | 组件建议 + 数据来源 |
| ASCII 布局 + 功能描述 | 文本 | 模块列表 |

## 输出格式

```markdown
# 组件设计方案：{页面名称}

## 组件树

```
UserManagementPage
├── SearchForm
│   ├── Input (姓名)
│   ├── Select (状态)
│   └── Button × 2 (搜索/重置)
├── UserTable
│   └── Column × 5
├── Pagination
└── EditUserModal (v-if="visible")
    ├── Input (姓名)
    ├── Input (邮箱)
    ├── Select (状态)
    └── Button × 2 (保存/取消)
```

---

## 组件说明

### 1. SearchForm

| 属性 | 内容 |
|------|------|
| **职责** | 收集用户筛选条件并触发搜索 |
| **文件路径** | `./components/SearchForm.vue` |
| **复用性** | 低（页面专属） |

#### Props
无（SearchForm 为自治组件，内部管理表单值）

#### Emits
| 事件名 | 载荷 | 触发时机 |
|--------|------|----------|
| `search` | `{ name: string, status: string }` | 点击搜索按钮 / 回车 |
| `reset` | 无 | 点击重置按钮 |

#### 内部状态
| 状态 | 类型 | 默认值 |
|------|------|--------|
| `form.name` | `string` | `''` |
| `form.status` | `string` | `''` |

---

### 2. UserTable

| 属性 | 内容 |
|------|------|
| **职责** | 渲染用户数据表格，暴露编辑/删除操作 |
| **文件路径** | `./components/UserTable.vue` |
| **复用性** | 中（其他管理页可能复用） |

#### Props
| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `users` | `User[]` | ✅ | — | 用户数据数组 |
| `loading` | `boolean` | — | `false` | 加载状态 |
| `emptyText` | `string` | — | `'暂无数据'` | 空状态文案 |

#### Emits
| 事件名 | 载荷 | 触发时机 |
|--------|------|----------|
| `edit` | `User` | 点击行编辑按钮 |
| `delete` | `User` | 点击行删除按钮 |
| `sort-change` | `{ prop: string, order: 'asc' \| 'desc' }` | 点击列头排序 |

#### Slots
| 插槽名 | 说明 |
|--------|------|
| `empty` | 自定义空状态内容 |

---

### 3. Pagination

| 属性 | 内容 |
|------|------|
| **职责** | 分页切换 |
| **文件路径** | 复用 `src/components/` 已有分页组件 或 `./components/Pagination.vue` |
| **复用性** | 高（全站复用） |

#### Props
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `current` | `number` | ✅ | 当前页码 |
| `total` | `number` | ✅ | 总条数 |
| `pageSize` | `number` | — | 每页条数，默认 20 |

#### Emits
| 事件名 | 载荷 | 说明 |
|--------|------|------|
| `change` | `number` | 页码变化 |

---

### 4. EditUserModal

| 属性 | 内容 |
|------|------|
| **职责** | 编辑用户信息弹窗 |
| **文件路径** | `./components/EditUserModal.vue` |
| **复用性** | 中 |

#### Props
| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `visible` | `boolean` | ✅ | 弹窗显隐 |
| `user` | `User \| null` | — | 编辑目标，null 为新增模式 |

#### Emits
| 事件名 | 载荷 | 说明 |
|--------|------|------|
| `close` | 无 | 关闭弹窗 |
| `saved` | `User` | 保存成功后传出 |

#### 校验规则
| 字段 | 规则 |
|------|------|
| 姓名 | 必填，2-20 字 |
| 邮箱 | 必填，email 格式 |
| 状态 | 必选 |

---

## 状态管理方案

```
┌─────────────────────────────────┐
│         Page State (父组件)       │
│  users, loading, pagination      │
│  filters, modalVisible, editUser │
└───┬──────────┬──────────┬───────┘
    │ Props↓   │ Props↓   │ Props↓
┌───┴───┐ ┌───┴───┐ ┌───┴──────┐
│Search │ │ Table │ │EditModal │
│ Form  │ │       │ │          │
└───┬───┘ └───┬───┘ └────┬─────┘
    │ Emit↑   │ Emit↑     │ Emit↑
    └─────────┴───────────┘
        回到 Page 统一处理
```

| 类型 | 存放位置 | 内容 |
|------|----------|------|
| **页面本地状态** | 父组件 `ref/reactive` | users, loading, filters, pagination |
| **UI 状态** | 组件内部 | 表单值、弹窗显隐、展开收起 |
| **全局状态** | Vuex/Pinia store | 无需（本页面状态不需跨页面共享） |
| **Composable** | `./hooks/useUserList.js` | fetchUsers、搜索、分页、编辑逻辑封装 |

### Composable 建议

```js
// hooks/useUserList.js
export function useUserList() {
  const users = ref([])
  const loading = ref(false)
  const filters = reactive({ name: '', status: '' })
  const pagination = reactive({ current: 1, pageSize: 20, total: 0 })

  const fetchUsers = async () => { /* ... */ }
  const search = (form) => { /* ... */ }
  const changePage = (page) => { /* ... */ }

  return { users, loading, filters, pagination, fetchUsers, search, changePage }
}
```

---

## 文件目录建议

```
src/views/UserManagement/
├── UserManagementPage.vue       # 页面容器（状态管理 + 布局）
├── components/
│   ├── SearchForm.vue           # 搜索表单
│   ├── UserTable.vue            # 用户表格
│   └── EditUserModal.vue        # 编辑弹窗
├── hooks/
│   └── useUserList.js           # 列表数据 + 搜索 + 分页逻辑
└── types/
    └── user.ts                  # User 类型定义（若用 TypeScript）
```

---

## 与项目现有组件的关系

| 本项目全局组件 | 可替代/增强 | 方式 |
|---------------|-------------|------|
| `HintModal.vue` | EditUserModal 可基于此封装 | import + wrap |
| `StatCard.vue` | 若有统计卡片需求 | 直接复用 |
| `ScopeSearchBox.vue` | 复杂搜索场景 | 参考其 Props 模式 |
```

---

## 拆分规则

### 单一职责原则
> 一个组件只做一件事，把它做好。

| ✅ 正确拆分 | ❌ 错误拆分 |
|------------|------------|
| `SearchForm` + `UserTable` + `Pagination` | `UserManagementEverything` |
| `EditUserModal`（弹窗）| 把弹窗逻辑写在 `UserTable` 里 |

### 粒度判断

| 条件 | 应拆分为独立组件 |
|------|-----------------|
| 有独立 Props 接口 | ✅ |
| 有独立 Emits 事件 | ✅ |
| 可能在其他页面复用 | ✅ |
| 有独立的加载/空/错误状态 | ✅ |
| 超过 150 行模板 | ✅ |
| 只是一个 `<div>` 包裹 | ❌ 不必拆 |

### 状态归属原则

| 状态类型 | 归属 |
|----------|------|
| 跨组件共享的数据（列表数据、筛选条件） | **父组件**（页面容器） |
| 仅组件内部使用的 UI 状态（输入框值、展开收起） | **组件自身** |
| 跨页面共享的数据（用户信息、权限） | **Vuex/Pinia Store** |
| 带副作用的可复用逻辑（请求、缓存、轮询） | **Composable（hooks/）** |

### 复用识别

| 项目现有组件 | 匹配条件 | 复用方式 |
|-------------|----------|----------|
| `src/components/*.vue` | 同名或功能相似 | 直接 import |
| Element UI / Ant Design | 表格、分页、弹窗、表单 | 二次封装为业务组件 |

---

## 工作步骤

1. **解析原型**：从输入中提取组件清单、交互流程、状态矩阵
2. **绘制组件树**：按父子关系 + 条件渲染组织层级（弹窗用 `v-if` 标注）
3. **逐组件定义接口**：
   - Props：列出名称、类型、必填、默认值
   - Emits：列出事件名、载荷类型、触发时机
   - Slots：列出插槽名和用途
4. **设计状态管理**：画数据流向图，标注 Props↓ Emits↑，决策 Store/Composable
5. **建议 Composable**：对带副作用的逻辑（请求、缓存）建议抽取为 hooks
6. **规划目录结构**：给出 `views/` 下的文件和文件夹建议
7. **检查复用**：扫描 `src/components/` 已有组件，标注可复用的

---

## 示例

### 输入（来自 LowFiPrototypeGenerator）

```
页面: 用户管理
组件: SearchForm(姓名+状态下拉+搜索+重置)
      UserTable(姓名|邮箱|状态|注册时间|操作)
      Pagination
弹窗: EditUserModal(编辑用户信息)
```

### 输出

（见上方「输出格式」中的完整方案）

---

## 注意事项

- **不直接输出代码**：只定义接口（Props/Emits/Slots），不写 `<template>` 和 `<script>` 实现
- **Props 向下，Emits 向上**：严格单向数据流，子组件不修改 Props
- **弹窗独立性**：弹窗组件自己管理表单校验，父组件只传 `visible` + `user`，收 `saved` 事件
- **优先复用已有组件**：生成前检查项目 `src/components/` 目录
- **Composable 非必须**：若页面逻辑简单（<3 个 API 调用），不需要 hooks；复杂列表页才建议抽取
- 与上游 `lowfi-prototype-generator` 的组件清单保持一致，逐项映射
