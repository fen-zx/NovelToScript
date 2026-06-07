---
name: api-integration-generator
description: '根据页面需求和数据模型生成完整 API 对接方案。用于前后端联调、接口设计、Mock 策略、错误处理、缓存策略。上游对接 requirement-analyzer 和 design-generator，支持 OpenAPI/Swagger 文档解析，输出可直接用于 src/api/ 封装的接口规范。'
argument-hint: '[页面规格 / 数据模型 / 接口文档]'
user-invocable: true
---

# API 对接生成器（ApiIntegrationGenerator）

## 目标

将页面的数据需求转化为完整的 API 对接方案：接口清单、请求/响应结构、错误码映射、缓存策略、Mock 方案——让前后端在写代码前对齐所有接口契约。

## 何时使用

- 页面数据需求明确后，前后端需要约定接口格式
- 后端接口还没写好，需要先定 Mock 方案
- 拿到 Swagger / OpenAPI 文档，需要转化为前端 `src/api/` 封装
- 联调阶段发现接口设计有问题，需要重新梳理

## 输入

| 来源 | 格式 | 说明 |
|------|------|------|
| RequirementAnalyzer 输出 | JSON（含 `data` 字段） | 最小输入，从数据字段推导接口 |
| DesignGenerator 输出 | Markdown PAGE_SPECS（含数据来源表） | 已有接口路径建议，最佳 |
| OpenAPI / Swagger | JSON / YAML | 直接解析已有文档 |
| 后端接口文档 | Markdown / Word | 手动整理 |

## 输出格式

````markdown
# API 对接方案：{业务模块}

---

## 1. 接口清单总览

| 序号 | 名称 | 方法 | 路径 | 用途 |
|------|------|------|------|------|
| 1 | 获取用户列表 | GET | `/api/users` | 分页查询 |
| 2 | 获取用户详情 | GET | `/api/users/:id` | 编辑前回填 |
| 3 | 创建用户 | POST | `/api/users` | 新增 |
| 4 | 更新用户 | PUT | `/api/users/:id` | 编辑保存 |
| 5 | 删除用户 | DELETE | `/api/users/:id` | 删除 |

---

## 2. 接口详情

### 2.1 获取用户列表

```
GET /api/users
```

#### 请求参数（Query）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | `number` | — | `1` | 页码 |
| `pageSize` | `number` | — | `20` | 每页条数，最大 100 |
| `keyword` | `string` | — | — | 姓名/邮箱模糊搜索 |
| `status` | `string` | — | — | 状态筛选：`active` / `disabled` |
| `sortBy` | `string` | — | `createdAt` | 排序字段 |
| `sortOrder` | `string` | — | `desc` | `asc` / `desc` |

#### 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "张三",
        "email": "zhang@example.com",
        "status": "active",
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 200,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.list[].id` | `number` | 用户唯一标识 |
| `data.list[].name` | `string` | 姓名 |
| `data.list[].email` | `string` | 邮箱 |
| `data.list[].status` | `'active' \| 'disabled'` | 账号状态 |
| `data.list[].createdAt` | `string(ISO8601)` | 注册时间 |
| `data.total` | `number` | 符合条件的总条数 |

---

### 2.2 更新用户

```
PUT /api/users/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 用户 ID |

#### 请求体（Body）

```json
{
  "name": "张三",
  "email": "zhang@example.com",
  "status": "active"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | ✅ | 2-20 字符 |
| `email` | `string` | ✅ | 邮箱格式 |
| `status` | `string` | ✅ | `active` / `disabled` |

#### 响应结构

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhang@example.com",
    "status": "active",
    "updatedAt": "2026-06-04T10:30:00Z"
  }
}
```

---

## 3. 错误码规范

### HTTP 状态码

| 状态码 | 含义 | 前端处理 |
|--------|------|----------|
| `200` | 成功 | 正常解析 `data` |
| `400` | 参数错误 | 展示 `message`，表单字段标红 |
| `401` | 未登录 | 跳转登录页，清除 token |
| `403` | 无权限 | Toast "无此操作权限" |
| `404` | 资源不存在 | Toast "用户不存在" |
| `409` | 冲突（如邮箱重复） | 表单字段标红 + message |
| `422` | 业务校验失败 | 展示具体校验错误 |
| `500` | 服务器异常 | Toast "服务器繁忙，请稍后重试" |

### 业务错误码（code 字段）

| code | 含义 | 处理 |
|------|------|------|
| `0` | 成功 | — |
| `1001` | 用户不存在 | Toast + 刷新列表 |
| `1002` | 邮箱已被占用 | 邮箱输入框标红 |
| `1003` | 不能禁用自己 | Toast 提示 |

---

## 4. 请求封装

### axios 实例复用

```js
// src/api/user.js  ← 新建文件
import request from './axios'  // 复用项目已有 axios 实例

export const userApi = {
  getList(params) {
    return request.get('/api/users', { params })
  },
  getById(id) {
    return request.get(`/api/users/${id}`)
  },
  create(data) {
    return request.post('/api/users', data)
  },
  update(id, data) {
    return request.put(`/api/users/${id}`, data)
  },
  delete(id) {
    return request.delete(`/api/users/${id}`)
  }
}
```

### 拦截器责任

| 拦截器 | 位置 | 职责 |
|--------|------|------|
| 请求拦截 | `src/api/axios.js` | 注入 token、loading 计数 |
| 响应拦截（成功） | `src/api/axios.js` | 解包 `response.data`、统一格式 |
| 响应拦截（失败） | `src/api/axios.js` | 错误码分发、401 跳转、全局 Toast |

---

## 5. 缓存策略

### 缓存矩阵

| 接口 | 策略 | TTL | 失效条件 |
|------|------|-----|----------|
| `GET /api/users`（列表） | Stale-While-Revalidate | 30s | 增/删/改后立即失效 |
| `GET /api/users/:id`（详情） | Cache-First | 5min | 该用户被编辑后失效 |
| `POST /api/users` | 不缓存 | — | 成功后刷新列表缓存 |
| `PUT /api/users/:id` | 不缓存 | — | 成功后失效列表+详情缓存 |
| `DELETE /api/users/:id` | 不缓存 | — | 成功后失效列表缓存 |

### 实现方式

```js
// hooks/useUserList.js 中的缓存示意
const cache = new Map()  // 或使用 @tanstack/vue-query

const fetchUsers = async (params) => {
  const key = JSON.stringify(params)
  const cached = cache.get(key)

  if (cached && Date.now() - cached.time < 30000) {
    return cached.data  // 30s 内返回缓存
  }

  const res = await userApi.getList(params)
  cache.set(key, { data: res, time: Date.now() })
  return res
}
```

---

## 6. Mock 方案

### 分阶段策略

| 阶段 | 方式 | 工具 |
|------|------|------|
| 原型演示 | 本地 JSON 文件 | `src/assets/json/` 静态数据 |
| 开发联调前 | 接口 Mock 平台 | YApi / Swagger Mock / MSW |
| 联调中 | 代理切换 | vite proxy → 后端地址 |
| 测试 | Mock Service Worker | 拦截网络请求，不侵入代码 |

### 本地 Mock 示例

```js
// vite.config.js 或 mock/user.js
export default [
  {
    url: '/api/users',
    method: 'get',
    response: ({ query }) => ({
      code: 0,
      data: {
        list: mockUsers.slice((query.page - 1) * 20, query.page * 20),
        total: mockUsers.length
      }
    })
  }
]
```

---

## 7. 接口依赖关系

```
页面加载
  │
  └─► GET /api/users ──► 渲染表格
        │
        ├─► 搜索 ──► GET /api/users?keyword=xx
        ├─► 编辑 ──► GET /api/users/:id ──► PUT /api/users/:id
        ├─► 新增 ──► POST /api/users
        └─► 删除 ──► DELETE /api/users/:id
```

### 并发请求

| 场景 | 策略 |
|------|------|
| 列表 + 统计卡片 | `Promise.all` 并行请求 |
| 编辑弹窗打开 | 先请求详情，再展示弹窗 |
| 下拉选项（状态列表） | 可预加载或与列表并行 |

---

## 8. 请求时序与竞态处理

| 场景 | 风险 | 处理 |
|------|------|------|
| 快速切换分页 | 旧请求返回覆盖新数据 | 请求级 AbortController 或 useRequest 自动取消 |
| 连续搜索 | 多次请求竞争 | 防抖 300ms + 取消前一次请求 |
| 重复提交 | 表单重复点击保存 | 按钮 loading 态 + 防重复提交 |

---

## 9. 前端代码封装建议

### 文件规划

```
src/
├── api/
│   ├── axios.js            # 已有：axios 实例 + 拦截器
│   ├── user.js             # 新增：用户模块接口
│   └── path.js             # 已有：路径常量（可选追加）
├── hooks/
│   └── useUserList.js      # Composable：封装请求 + 缓存 + 状态
└── views/
    └── UserManagement/
        └── ...
```

---

## 10. 疑问列表

> 以下字段/行为在需求中未明确，请与后端确认：

- [ ] 列表默认排序字段是 `createdAt` 还是 `updatedAt`？
- [ ] 删除是物理删除还是软删除（标记 `deletedAt`）？
- [ ] 是否需要批量操作接口（批量删除/批量启用）？
- [ ] 分页 `pageSize` 上限是多少？
- [ ] 用户头像是否需要单独的上传接口？
````

---

## 生成规则

### RESTful 方法推断

| 操作类型 | HTTP 方法 | 路径模式 |
|----------|-----------|----------|
| 列表查询 | `GET` | `/api/{resource}` |
| 单条查询 | `GET` | `/api/{resource}/:id` |
| 创建 | `POST` | `/api/{resource}` |
| 全量更新 | `PUT` | `/api/{resource}/:id` |
| 部分更新 | `PATCH` | `/api/{resource}/:id` |
| 删除 | `DELETE` | `/api/{resource}/:id` |
| 批量操作 | `POST` | `/api/{resource}/batch` |

### 响应结构推断

1. 从 RequirementAnalyzer 的 `data` 字段 → 生成响应 JSON 字段
2. 列表接口自动追加 `total` / `page` / `pageSize`
3. 详情接口包含所有可编辑字段 + `id` + 时间戳
4. 所有响应包裹在 `{ code, message, data }` 标准壳中（遵循项目现有规范）

### 错误码推断

1. 需求中的校验规则 → 对应 `400` / `422` + 业务错误码
2. 唯一性约束（邮箱）→ `409` + 专门错误码
3. 权限相关操作 → `403`
4. 通用兜底 → `500`

### 缓存策略推断

| 接口特征 | 缓存建议 |
|----------|----------|
| 列表查询，数据变动频率低 | SWR 30s-1min |
| 详情，主要用于编辑回填 | Cache-First 5min |
| 字典/下拉选项 | Cache-First 10min，应用启动时预加载 |
| 写操作（POST/PUT/DELETE）| 不缓存，成功后失效关联缓存 |

---

## 工作步骤

1. **提取数据需求**：从输入中解析所有数据字段和操作类型
2. **推导接口清单**：按 RESTful 规范为每个操作生成接口
3. **设计请求参数**：查询参数 + 路径参数 + 请求体，标注类型和必填
4. **设计响应结构**：生成完整 JSON 示例，每个字段标注类型和说明
5. **映射错误码**：覆盖 HTTP 状态码 + 业务错误码 + 前端处理策略
6. **规划缓存**：按缓存矩阵逐接口标注策略和 TTL
7. **设计 Mock**：给出分阶段的 Mock 方案
8. **生成疑问列表**：标注需求中未明确的字段和行为
9. **输出代码封装**：给出 `src/api/` 下的文件结构和封装示例

## 示例

### 输入（来自 RequirementAnalyzer）

```json
{
  "pages": [{
    "name": "用户管理",
    "modules": [{
      "name": "用户列表",
      "features": ["查看用户", "搜索用户", "编辑用户"],
      "data": ["姓名", "邮箱", "状态", "注册时间"]
    }]
  }]
}
```

### 输出

（见上方「输出格式」中的完整方案）

---

## 注意事项

- **不得猜测业务字段**：需求中未出现的字段标注 `[待确认]`，放入疑问列表
- **遵循项目现有规范**：本项目响应格式为 `{ code, message, data }`，请求用 `src/api/axios.js` 实例
- **分页参数标准化**：统一使用 `page` + `pageSize`（而非 `offset` + `limit`）
- **时间格式统一**：响应中时间字段用 ISO 8601 字符串（`2026-01-01T00:00:00Z`）
- **错误码与业务解耦**：HTTP 状态码处理通用错误（网络、认证），`code` 字段处理业务错误
- **缓存要有失效机制**：不能只缓存不失效，写操作必须触发相关缓存清除
- 与 `requirement-analyzer` 的 `data` 字段、`design-generator` 的"数据来源"表保持一致
