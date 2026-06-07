# API 对接方案 — AI小说转剧本工具

> 基于 DATABASE_SCHEMA + PAGE_SPECS 生成 | 日期: 2026-06-05
> 响应规范: `{ code, message, data }` | 分页: `page` + `pageSize`

---

## 1. 接口清单总览

| 编号 | 名称           | 方法   | 路径                           | 用途                 |
| ---- | -------------- | ------ | ------------------------------ | -------------------- |
| A0a  | 用户注册       | POST   | `/api/auth/register`           | 新用户注册           |
| A0b  | 用户登录       | POST   | `/api/auth/login`              | 账号密码登录         |
| A0c  | 密码重置       | POST   | `/api/auth/reset-password`     | 用户名验证后重置     |
| A0d  | 账号可用性检查 | GET    | `/api/auth/register`           | 注册时实时校验       |
| A1   | 导入小说       | POST   | `/api/novels/import`           | 上传小说文件         |
| A2   | 创建任务       | POST   | `/api/tasks`                   | 创建 AI 分析任务     |
| A3   | 任务列表       | GET    | `/api/tasks`                   | 分页 + 状态筛选      |
| A4   | 任务详情       | GET    | `/api/tasks/:id`               | 含 Agent 结果        |
| A5   | 任务进度流     | GET    | `/api/tasks/:id/stream`        | SSE 实时推送         |
| A6   | 获取剧本       | GET    | `/api/scripts/:id`             | 当前版本+人物列表    |
| A7   | 更新剧本       | PUT    | `/api/scripts/:id`             | 保存 + 创建新版本    |
| A8   | AI 润色        | POST   | `/api/scripts/:id/polish`      | 7 种风格可选         |
| A9   | 获取 Schema    | GET    | `/api/schema`                  | YAML Schema 定义     |
| A10  | 重试任务       | POST   | `/api/tasks/:id/retry`         | 断点/从头重试        |
| A11  | 版本列表       | GET    | `/api/scripts/:id/versions`    | 历史版本摘要         |
| A12  | 版本详情       | GET    | `/api/scripts/:id/versions/:v` | 指定版本完整内容     |
| A13  | 版本回滚       | POST   | `/api/scripts/:id/rollback`    | 回滚到指定版本       |
| A14  | 导出剧本       | GET    | `/api/scripts/:id/export`      | yaml/json/md/txt/pdf |
| A15  | 删除任务       | DELETE | `/api/tasks/:id`               | 删除任务及结果       |

---

## 2. 接口详情

### A0a — 用户注册

```
POST /api/auth/register
```

**请求体**

| 字段       | 类型     | 必填 | 说明                     |
| ---------- | -------- | ---- | ------------------------ |
| `username` | `string` | ✅   | 2-20 字符                |
| `account`  | `string` | ✅   | 字母数字下划线，不可重复 |
| `password` | `string` | ✅   | ≥6 位                    |

```json
{ "username": "张三", "account": "zhangsan", "password": "mypassword" }
```

**响应 201**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": "clx...",
    "username": "张三",
    "account": "zhangsan",
    "createdAt": "2026-06-05T10:00:00Z"
  }
}
```

**错误 409** → `{ "code":2001, "message":"账号已存在" }`

---

### A0b — 用户登录

```
POST /api/auth/login
```

**请求体**: `{ "account":"zhangsan", "password":"mypassword" }`

**响应 200**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": "clx...", "username": "张三", "account": "zhangsan" }
  }
}
```

**错误 401** → `{ "code":2003, "message":"账号或密码错误" }`

---

### A0c — 密码重置

```
POST /api/auth/reset-password
```

**请求体**: `{ "username":"张三", "newPassword":"newpassword123" }`

**响应 200** → `{ "code":0, "message":"密码重置成功", "data":null }`

**错误 404** → `{ "code":2002, "message":"用户名不存在" }`

---

### A0d — 账号可用性检查

```
GET /api/auth/register?check=account&value=zhangsan
```

**用途**: 注册表单实时校验账号是否已被占用（防抖 300ms 后调用）

**查询参数**

| 参数    | 类型   | 必填 | 说明                             |
| ------- | ------ | ---- | -------------------------------- |
| `check` | string | ✅   | 固定值 `"account"`               |
| `value` | string | ✅   | 待检查的账号名（字母数字下划线） |

**响应 200**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "available": true
  }
}
```

| 字段             | 类型      | 说明                         |
| ---------------- | --------- | ---------------------------- |
| `data.available` | `boolean` | `true` 可用 / `false` 已占用 |

**说明**: 此接口与 A0a 共用路径 `/api/auth/register`，通过 Query `?check=account` 区分。

---

### A1 — 导入小说

```
POST /api/novels/import
Content-Type: multipart/form-data
```

**FormData**

| `file` | File | ✅ | .txt/.docx/.md, ≤20MB |
| `title` | string | ✅ | 书名 |
| `author` | string | | 选填 |

**响应 201**

```json
{
  "code": 0,
  "message": "导入成功",
  "data": {
    "id": "clx...",
    "title": "斗破苍穹",
    "author": "天蚕土豆",
    "chapterCount": 24,
    "wordCount": 125000,
    "fileFormat": "TXT",
    "createdAt": "2026-06-05T10:00:00Z"
  }
}
```

**错误 413** → `{ "code":5002, "message":"文件超过 20MB 限制" }`

---

### A2 — 创建分析任务

```
POST /api/tasks
```

**请求体**: `{ "novelId":"clx..." }`

**响应 201** → `{ "code":0, "message":"任务已创建", "data":{ "id":"clx...", "status":"QUEUED", "progress":0 } }`

**队列满 429** → `{ "code":3001, "message":"排队已满（最多 3 个），请稍后再试" }`

---

### A3 — 任务列表

```
GET /api/tasks?page=1&pageSize=20&status=PROCESSING&sortBy=createdAt&sortOrder=desc
```

| 参数        | 类型   | 默认      | 说明                          |
| ----------- | ------ | --------- | ----------------------------- |
| `page`      | number | 1         | 页码                          |
| `pageSize`  | number | 20        | 最大 100                      |
| `status`    | string |           | 逗号分隔: `QUEUED,PROCESSING` |
| `sortBy`    | string | createdAt |                               |
| `sortOrder` | string | desc      | asc/desc                      |

**响应 200**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "clx...",
        "novelTitle": "斗破苍穹",
        "status": "PROCESSING",
        "progress": 0.45,
        "currentAgent": "Scene Planning",
        "createdAt": "2026-06-05T10:01:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### A4 — 任务详情

```
GET /api/tasks/:id
```

**响应 200**

```json
{
  "code": 0,
  "data": {
    "id": "clx...",
    "novelTitle": "斗破苍穹",
    "status": "PROCESSING",
    "progress": 0.67,
    "currentAgent": "Scene Planning",
    "startedAt": "2026-06-05T10:01:00Z",
    "completedAt": null,
    "errorMessage": null,
    "agentResults": [
      {
        "agentName": "Novel Analysis",
        "status": "DONE",
        "output": { "chapters": 24, "genre": "都市玄幻" },
        "startedAt": "...",
        "completedAt": "..."
      }
    ],
    "scriptId": null,
    "createdAt": "2026-06-05T10:01:00Z"
  }
}
```

---

### A5 — 任务进度流 (SSE)

```
GET /api/tasks/:id/stream
```

**事件类型**

| 事件             | 触发       | data                                                 |
| ---------------- | ---------- | ---------------------------------------------------- |
| `agent:start`    | Agent 开始 | `{"agent":"Scene Planning","message":"正在规划..."}` |
| `agent:progress` | 执行中     | `{"agent":"Scene Planning","percent":67}`            |
| `agent:done`     | 完成       | `{"agent":"Scene Planning","summary":"18 个场景"}`   |
| `agent:error`    | 失败       | `{"agent":"Scene Planning","error":"Token 超限"}`    |
| `task:complete`  | 全部完成   | `{"scriptId":"clx..."}`                              |

---

### A6 — 获取剧本

```
GET /api/scripts/:id
```

**响应 200**

```json
{
  "code": 0,
  "data": {
    "id": "clx...",
    "title": "斗破苍穹",
    "currentVersion": 3,
    "content": "script:\n  meta:\n    title: 斗破苍穹\n  ...",
    "characters": [
      {
        "id": "clx...",
        "name": "萧炎",
        "role": "PROTAGONIST",
        "description": "天才少年",
        "traits": ["坚韧", "热血"]
      }
    ],
    "novelTitle": "斗破苍穹",
    "novelAuthor": "天蚕土豆",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### A7 — 更新剧本

```
PUT /api/scripts/:id
```

**请求体**: `{ "content":"script:\n...", "note":"调整场景顺序" }`

**响应 200**

```json
{
  "code": 0,
  "message": "保存成功",
  "data": {
    "id": "clx...",
    "currentVersion": 4,
    "version": {
      "versionNumber": 4,
      "note": "调整场景顺序",
      "createdAt": "..."
    },
    "updatedAt": "2026-06-05T12:30:00Z"
  }
}
```

---

### A8 — AI 润色

```
POST /api/scripts/:id/polish
```

**请求体**

| `style` | string | ✅ | `faithful`/`tv_drama`/`short_drama`/`anime`/`movie`/`tv_series`/`stage` |
| `targetSection` | string | | `all`(默认) / 场景编号 `scenes[0,2,5]` |

**响应 202** → `{ "code":0, "message":"润色任务已入队", "data":{"taskId":"clx...","status":"QUEUED"} }`

> 完成后 SSE 推送，前端自动替换编辑器内容。

---

### A9 — 获取 Schema

```
GET /api/schema
```

**响应 200**

```json
{
  "code": 0,
  "data": {
    "version": "1.0.0",
    "schema": {
      /* JSON Schema */
    },
    "designRationale": "# 设计原因\n...",
    "example": "script:\n  ...",
    "updatedAt": "2026-06-01T00:00:00Z"
  }
}
```

---

### A10 — 重试任务

```
POST /api/tasks/:id/retry
```

**请求体**: `{ "mode":"resume" }` — `resume`(断点) / `restart`(从头)

**响应 202** → `{ "code":0, "message":"已重新入队", "data":{"id":"clx...", "status":"QUEUED", "resumeFrom":"Scene Planning"} }`

---

### A11 — 版本列表

```
GET /api/scripts/:id/versions
```

**响应 200** → `{ "code":0, "data":[{"versionNumber":3,"note":"AI润色","createdAt":"..."},{"versionNumber":2,"note":"手动调整","createdAt":"..."}] }`

---

### A12 — 版本详情

```
GET /api/scripts/:id/versions/:v
```

**响应 200** → `{ "code":0, "data":{"versionNumber":2,"content":"script:\n...","note":"手动调整","createdAt":"..."} }`

---

### A13 — 版本回滚

```
POST /api/scripts/:id/rollback
```

**请求体**: `{ "version":2 }`

**响应 200** → `{ "code":0, "message":"已回滚到 v2", "data":{"id":"clx...","currentVersion":4,"rolledFrom":3,"updatedAt":"..."} }`

> 回滚创建新版本（v4=v2 内容），不删除中间版本。

---

### A14 — 导出剧本

```
GET /api/scripts/:id/export?format=pdf
```

| `format` | string | ✅ | `yaml`/`json`/`md`/`txt`/`pdf` |

- 文本格式: `Content-Type: text/plain` 直接下载
- PDF: 后端 Puppeteer 渲染，`Content-Type: application/pdf`
- 文件名: `{title}_剧本_v{version}.{ext}`（Content-Disposition）

---

### A15 — 删除任务

```
DELETE /api/tasks/:id
```

**用途**: P3 任务列表的删除操作，物理删除任务及其 AgentResult

**响应 200**

```json
{
  "code": 0,
  "message": "任务已删除",
  "data": null
}
```

**错误 404** → `{ "code":3002, "message":"任务不存在" }`

---

## 3. 错误码规范

### HTTP 状态码

| 状态码 | 含义        | 前端处理                 |
| ------ | ----------- | ------------------------ |
| `200`  | 成功        | 解析 `data`              |
| `201`  | 创建成功    | 跳转/刷新                |
| `202`  | 异步已接受  | SSE 跟踪                 |
| `400`  | 参数错误    | 表单标红 + `message`     |
| `401`  | 未登录/过期 | 跳转 `/auth`，清除 token |
| `403`  | 无权限      | Toast                    |
| `404`  | 不存在      | 具体提示                 |
| `409`  | 冲突        | 字段标红                 |
| `413`  | 文件过大    | Toast "超过 20MB"        |
| `429`  | 队列满      | Toast + 按钮置灰         |
| `500`  | 服务器异常  | Toast "请稍后重试"       |

### 业务错误码

| code   | 含义               | 处理              |
| ------ | ------------------ | ----------------- |
| `2001` | 账号已存在         | 注册 account 标红 |
| `2002` | 用户名不存在       | 重置页提示        |
| `2003` | 账号或密码错误     | 登录顶部红色提示  |
| `3001` | 排队已满 (3/3)     | Toast + 按钮置灰  |
| `3002` | 任务运行中无法重试 | Toast             |
| `5001` | AI 服务不可用      | Toast             |
| `5002` | 文件上传失败       | Toast "请重试"    |
| `5003` | PDF 生成失败       | Toast "请重试"    |

---

## 4. 前端代码封装

### 文件规划

```
src/api/
├── request.ts       # axios 实例 + JWT 拦截 + 401 跳转
├── auth.ts          # A0a/A0b/A0c
├── novels.ts        # A1
├── tasks.ts         # A2/A3/A4/A10
├── tasksSSE.ts      # A5 SSE 封装
├── scripts.ts       # A6/A7/A8/A11/A12/A13/A14
└── schema.ts        # A9
```

### 核心封装示例

```ts
// src/api/request.ts
import axios from "axios";
const request = axios.create({ baseURL: "/api", timeout: 30000 });
request.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
request.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      location.href = "/auth";
    }
    return Promise.reject(err);
  },
);
export default request;

// src/api/scripts.ts
import request from "./request";
export const scriptApi = {
  getById: (id: string) => request.get(`/scripts/${id}`),
  update: (id: string, data: { content: string; note?: string }) =>
    request.put(`/scripts/${id}`, data),
  polish: (id: string, data: { style: string; targetSection?: string }) =>
    request.post(`/scripts/${id}/polish`, data),
  getVersions: (id: string) => request.get(`/scripts/${id}/versions`),
  getVersion: (id: string, v: number) =>
    request.get(`/scripts/${id}/versions/${v}`),
  rollback: (id: string, version: number) =>
    request.post(`/scripts/${id}/rollback`, { version }),
  export: (id: string, format: string) =>
    request.get(`/scripts/${id}/export`, {
      params: { format },
      responseType: "blob",
    }),
};
```

---

## 5. 缓存策略

| 接口                            | 策略        | TTL  | 失效条件             |
| ------------------------------- | ----------- | ---- | -------------------- |
| `GET /api/tasks`                | SWR         | 30s  | 创建/重试/删除后失效 |
| `GET /api/scripts/:id`          | Cache-First | 5min | 保存/回滚后失效      |
| `GET /api/scripts/:id/versions` | SWR         | 30s  | 保存/回滚后失效      |
| `GET /api/schema`               | Cache-First | 1h   | Schema 更新后失效    |
| POST/PUT/DELETE                 | 不缓存      | —    | 成功后失效关联缓存   |

---

## 6. Mock 方案

| 阶段 | 方式       | 工具                                |
| ---- | ---------- | ----------------------------------- |
| 原型 | 本地 JSON  | `prototype/index.html` 内嵌         |
| 开发 | MSW        | `src/mocks/handlers/` 拦截 fetch    |
| 联调 | Vite Proxy | `vite.config.ts` → `localhost:3000` |

---

## 7. 竞态处理

| 场景         | 处理                         |
| ------------ | ---------------------------- |
| 快速切换分页 | `AbortController` 取消旧请求 |
| 连续搜索     | 防抖 300ms + 取消前一次      |
| 自动保存冲突 | 版本号乐观锁                 |
| 重复提交     | 按钮 loading + 防重复        |

---

## 8. 接口依赖关系

```
P0 → A0a/A0b/A0c
P1 → A3(pageSize=5)
P2 → A1 → A2
P3 → A3, A10, DELETE /api/tasks/:id
P4 → A4, A5(SSE)
P5 → A6, A7, A8, A11, A12, A13, A14
P6 → A9
```

---

## 9. 疑问列表

- [x] 响应格式 `{code, message, data}` ✅
- [x] 分页 `page+pageSize` ✅
- [x] 时间格式 ISO 8601 ✅
- [ ] 是否需要"取消排队任务"接口？
- [ ] 导出 PDF 是否返回异步 taskId（当前为同步下载）？
- [ ] 是否需要文件上传进度回调？
