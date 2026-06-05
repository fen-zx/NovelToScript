# PROJECT_STATE — 项目状态追踪

> 最后更新: 2026-06-05

---

## 整体进度

```
进度: 65%  █████████████░░░░░░░  前端代码已生成，后端待初始化
```

### 产物清单

| 产物          | 路径                                 | 状态                         |
| ------------- | ------------------------------------ | ---------------------------- | --- | ---------- | ------------------------------ | ------------------ |
| PRD 需求文档  | `docs/prem/PRD.md`                   | ✅ 完成（14 问全部确认）     |
| 系统设计      | `docs/prem/DESIGN.md`                | ✅ 完成                      |
| 架构决策      | `docs/prem/DECISIONS.md`             | ✅ 完成（14 条 D-001~D-014） |
| 页面规格      | `docs/prem/PAGE_SPECS.md`            | ✅ 完成                      |
| API 规格      | `docs/prem/API_SPECS.md`             | ✅ 完成（17 个接口）         |
| 页面设计      | `docs/prem/PAGE_DESIGN.md`           | ✅ 完成（7 页完整设计）      |
| 布局评审      | `docs/prem/LAYOUT_REVIEW.md`         | ✅ 完成（79/100）            |
| 低保真原型    | `docs/prem/LOWFI_PROTOTYPE.md`       | ✅ 完成                      |
| HTML 原型     | `prototype/index.html`               | ✅ 完成（毛玻璃风格）        |
| 后端架构      | `docs/prem/ARCHITECTURE.md`          | ✅ 完成（18 章节）           |     | 数据库设计 | `docs/prem/DATABASE_SCHEMA.md` | ✅ 完成（14 章节） |
| Prisma Schema | `prisma/schema.prisma`               | ✅ 完成（9 表 + 4 枚举）     |     | 组件方案   | `docs/prem/COMPONENT_SPECS.md` | ✅ 完成（43 组件） |
| 实现蓝图      | `docs/prem/PAGE_IMPLEMENTATION.md`   | ✅ 完成（7页路由+数据流）    |
| 前端架构      | `docs/prem/FRONTEND_ARCHITECTURE.md` | ✅ 完成（16 章节）           |

---

## 页面状态

| 页面             | 状态          | 完成度 |
| ---------------- | ------------- | ------ |
| P0 登录注册页    | 🟢 容器已生成 | 60%    |
| P1 项目首页      | 🟢 容器已生成 | 60%    |
| P2 小说导入页    | 🟢 容器已生成 | 60%    |
| P3 分析任务页    | 🟢 容器已生成 | 60%    |
| P4 任务详情页    | 🟢 容器已生成 | 60%    |
| P5 剧本编辑页    | 🟢 容器已生成 | 60%    |
| P6 Schema 文档页 | 🟢 容器已生成 | 60%    |

> 剩余工作: 拆分子组件、接入真实 API、SSE 联调、Monaco Editor 集成

---

## 组件状态

| 组件            | 状态      |
| --------------- | --------- |
| 全局组件 (7)    | 🟢 已生成 |
| P0 业务 (4)     | 🟡 待拆分 |
| P1 业务 (3)     | 🟡 待拆分 |
| P2 业务 (7)     | 🟡 待拆分 |
| P3 业务 (4)     | 🟡 待拆分 |
| P4 业务 (4)     | 🟡 待拆分 |
| P5 业务 (7)     | 🟡 待拆分 |
| P6 业务 (4)     | 🟡 待拆分 |
| Pinia Store (3) | 🟢 已生成 |

> 全局组件: AppLayout, AppLayoutMobile, CacheIndicator, NotificationCenter, QueueIndicator, TaskStatusTag, ThemeToggle

---

## 接口状态

| 接口                                 | 状态          |
| ------------------------------------ | ------------- |
| A0a POST /api/auth/register          | 🟡 前端已封装 |
| A0b POST /api/auth/login             | 🟡 前端已封装 |
| A0c POST /api/auth/reset-password    | 🟡 前端已封装 |
| A1 POST /api/novels/import           | 🟡 前端已封装 |
| A2 POST /api/tasks                   | 🟡 前端已封装 |
| A3 GET /api/tasks                    | 🟡 前端已封装 |
| A4 GET /api/tasks/:id                | 🟡 前端已封装 |
| A5 GET /api/tasks/:id/stream         | 🟡 前端已封装 |
| A6 GET /api/scripts/:id              | 🟡 前端已封装 |
| A7 PUT /api/scripts/:id              | 🟡 前端已封装 |
| A8 POST /api/scripts/:id/polish      | 🟡 前端已封装 |
| A9 GET /api/schema                   | 🟡 前端已封装 |
| A10 POST /api/tasks/:id/retry        | 🟡 前端已封装 |
| A11 GET /api/scripts/:id/versions    | 🟡 前端已封装 |
| A12 GET /api/scripts/:id/versions/:v | 🟡 前端已封装 |
| A13 POST /api/scripts/:id/rollback   | 🟡 前端已封装 |
| A14 GET /api/scripts/:id/export      | 🟡 前端已封装 |

---

## 前端代码清单

```
frontend/src/
├── main.ts                          ✅ 入口: Vue + Pinia + Router + ElementPlus
├── App.vue                          ✅ 根组件
├── api/
│   ├── request.ts                   ✅ Axios 实例: JWT 拦截器 + 401 重定向
│   ├── auth.ts                      ✅ 认证 API (login/register/reset/check)
│   ├── novels.ts                    ✅ 小说导入 API (FormData)
│   ├── tasks.ts                     ✅ 任务 CRUD + 重试
│   ├── tasksSSE.ts                  ✅ SSE 连接 (5 事件处理器)
│   ├── scripts.ts                   ✅ 剧本 CRUD + 润色 + 版本 + 导出
│   └── schema.ts                    ✅ Schema 查询
├── router/
│   └── index.ts                     ✅ 7 路由 + AuthGuard (requiresAuth/guest)
├── stores/
│   ├── auth.ts                      ✅ 认证状态 (token/user/isLoggedIn)
│   ├── notification.ts              ✅ 消息队列 (push/shift/toggle)
│   └── theme.ts                     ✅ 主题切换 (isDark/toggle/apply)
├── hooks/
│   ├── useSSE.ts                    ✅ 通用 SSE Hook (自动重连 3 次)
│   └── useCache.ts                  ✅ IndexedDB 缓存封装
├── types/
│   ├── api.ts                       ✅ ApiResponse / PaginatedData / 枚举
│   ├── task.ts                      ✅ TaskSummary / AgentResult / TaskDetail
│   ├── script.ts                    ✅ ScriptDetail / Version / ValidationError
│   └── novel.ts                     ✅ NovelInfo / Chapter / FileInfo
├── utils/
│   ├── constants.ts                 ✅ 标签映射 / 文件限制 / 并发上限
│   └── validators.ts                ✅ 邮箱/账号/密码/用户名/文件大小校验
├── components/
│   ├── AppLayout.vue                ✅ 桌面布局 (侧边栏 + 顶栏 + 主区域)
│   ├── AppLayoutMobile.vue          ✅ 移动布局 (底部Tab + 抽屉菜单)
│   ├── CacheIndicator.vue           ✅ 缓存状态指示
│   ├── NotificationCenter.vue       ✅ 通知中心 (铃铛 + 下拉面板)
│   ├── QueueIndicator.vue           ✅ 队列指示 (X/1 排队: Y/3)
│   ├── TaskStatusTag.vue            ✅ 任务状态标签 (颜色映射)
│   └── ThemeToggle.vue              ✅ 主题切换按钮 (太阳/月亮)
└── views/
    ├── Auth/AuthPage.vue            ✅ P0 登录/注册/重置 Tab 切换
    ├── Home/HomePage.vue            ✅ P1 概览 + 快速操作 + 最近任务
    ├── Import/ImportPage.vue        ✅ P2 四步导入流程
    ├── Tasks/TaskListPage.vue       ✅ P3 任务列表 + 筛选 + 分页 + 重试
    ├── TaskDetail/TaskDetailPage.vue ✅ P4 SSE 流水线 + Agent 进度
    ├── ScriptEditor/ScriptEditorPage.vue ✅ P5 分屏编辑器 + 导出 + 版本
    └── Schema/SchemaPage.vue        ✅ P6 Schema 树 + 字段表
```

---

## 迭代计划

| 迭代   | 目标                           | 日期       |
| ------ | ------------------------------ | ---------- |
| Iter-1 | ✅ 前端项目脚手架 + 数据库模型 | 2026-06-05 |
| Iter-2 | 小说导入 + 分析任务核心流程    | TBD        |
| Iter-3 | Agent 流水线集成 + SSE 进度    | TBD        |
| Iter-4 | 剧本编辑页 + YAML Schema       | TBD        |
| Iter-5 | 润色 + 导出 + 优化             | TBD        |
