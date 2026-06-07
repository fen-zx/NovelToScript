---
name: decision-recorder
description: '记录项目设计开发中的架构决策、技术选型、方案取舍及理由。用于 ADR (Architecture Decision Record)、团队知识沉淀、多轮迭代回溯。上游对接全链路 Skill 输出，自动从 layout-optimizer、component-generator 等输出中提取决策点，输出可追溯的决策日志。'
argument-hint: '[决策 JSON / 自然语言 / Skill 输出]'
user-invocable: true
---

# 决策记录器（DecisionRecorder）

## 目标

将项目中每一个"为什么选 A 不选 B"的设计决策结构化记录，沉淀为 Architecture Decision Record (ADR)，避免团队成员重复争论、新人接手时摸不着头脑、多轮迭代后忘记当初的理由。

## 何时使用

- 组件拆分方案二选一（弹窗 vs 新页面 / 一个组件 vs 拆两个）
- 布局优化采纳了某个建议
- API 设计选型（RESTful vs GraphQL / 分页方式）
- 状态管理选型（Vuex vs Pinia vs Composable）
- 技术栈决策（路由方案、构建工具、UI 库）
- 迭代回顾，汇总本轮所有决策

## 输入

### 方式一：JSON 结构化

```json
{
  "title": "用户列表分页方案选择",
  "category": "api",
  "context": "用户数据预计超过 10 万条，列表页需要分页展示",
  "options": [
    "前端分页（一次加载全部，前端切页）",
    "后端分页（每次请求一页）",
    "无限滚动"
  ],
  "chosen": "后端分页",
  "reason": "数据量大，前端分页会导致首屏加载慢；无限滚动不适合需要精确跳转场景",
  "consequences": {
    "gain": ["首屏加载快", "支持跳转到任意页", "搜索筛选可与分页组合"],
    "tradeoff": ["每次切页需请求后端", "离线场景无法浏览已加载页之外的数据"]
  },
  "related_decisions": ["D-003 列表缓存策略"],
  "related_skill": "api-integration-generator",
  "status": "accepted",
  "author": "张三",
  "date": "2026-06-04"
}
```

### 方式二：从 Skill 输出自动提取

当用户提供 `layout-optimizer`、`component-generator` 等 Skill 的输出时，自动识别其中的决策点并生成记录。

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 决策主题，一句话概括 |
| `category` | ✅ | 决策分类（见下表） |
| `context` | ✅ | 决策背景：为什么要做这个决定 |
| `options` | ✅ | 所有被考虑的方案（≥2 个） |
| `chosen` | ✅ | 最终选择 |
| `reason` | ✅ | 选择理由（核心！） |
| `consequences` | 推荐 | 正反后果：获得什么 + 牺牲什么 |
| `related_decisions` | — | 关联决策 ID 列表 |
| `related_skill` | — | 触发此决策的 Skill |
| `status` | — | 默认 `accepted` |
| `author` | — | 默认 `AI Assistant` |
| `date` | — | 默认当天 |

---

## 决策分类

| category | 说明 | 典型来源 Skill |
|----------|------|---------------|
| `architecture` | 架构级决策（框架、构建工具） | — |
| `component` | 组件拆分/职责/接口 | `component-generator` |
| `layout` | 布局结构/模块位置 | `layout-optimizer` |
| `api` | 接口设计/分页/缓存 | `api-integration-generator` |
| `state` | 状态管理方案 | `page-generator` |
| `interaction` | 交互方式（弹窗/跳转） | `lowfi-prototype-generator` |
| `data` | 数据模型/字段设计 | `requirement-analyzer` |

---

## 决策状态流转

```
proposed → accepted → deprecated
                ↓
           superseded → 指向新决策 ID
```

| 状态 | 说明 |
|------|------|
| `proposed` | 提案中，待团队评审 |
| `accepted` | 已采纳，当前生效 |
| `deprecated` | 已废弃，不再适用 |
| `superseded` | 被新决策取代，需注明 `superseded_by` |

---

## 输出格式

追加/更新项目根目录 `DECISIONS.md`，每条决策分配唯一 ID（D-001, D-002...）。

```markdown
# 架构决策记录 (ADR)

---

## D-001 · 用户列表分页方案选择

| 属性 | 内容 |
|------|------|
| **日期** | 2026-06-04 |
| **分类** | api |
| **状态** | ✅ accepted |
| **作者** | 张三 |
| **来源** | api-integration-generator |

### 背景
用户数据预计超过 10 万条，列表页需要分页展示。

### 可选方案

| 方案 | 描述 | 评估 |
|------|------|------|
| A. 前端分页 | 一次加载全部，前端切页 | ❌ 首屏慢，内存占用高 |
| B. 后端分页 | 每次请求一页 | ✅ 性能好，支持精确跳转 |
| C. 无限滚动 | 滚动到底部自动加载 | ❌ 不适合需要精确跳转场景 |

### 最终选择
**B. 后端分页**

### 理由
- 数据量 10 万级，前端分页首屏加载不可接受
- 无限滚动无法满足"跳到第 50 页"的需求
- 后端分页与搜索筛选组合更自然

### 后果
| ➕ 获得 | ➖ 牺牲 |
|---------|--------|
| 首屏加载快 | 每次切页需请求后端 |
| 支持跳转到任意页 | 离线场景无法浏览未加载页 |
| 搜索+分页可组合 | — |

### 关联决策
- D-003 列表缓存策略（30s SWR）

---

## D-002 · 编辑用户使用弹窗而非新页面

| 属性 | 内容 |
|------|------|
| **日期** | 2026-06-04 |
| **分类** | interaction |
| **状态** | ✅ accepted |
| **作者** | 李四 |
| **来源** | lowfi-prototype-generator |

### 背景
编辑用户信息有"弹窗编辑"和"跳转新页面编辑"两种方式。

### 可选方案

| 方案 | 评估 |
|------|------|
| A. 弹窗编辑 | ✅ 不离开列表上下文，编辑完直接看到结果 |
| B. 新页面编辑 | ❌ 编辑完需返回，打断操作流 |

### 最终选择
**A. 弹窗编辑**

### 理由
- 编辑字段仅 3 个，弹窗足够容纳
- 保持用户在列表上下文，编辑后立即看到更新
- 减少路由跳转，降低页面状态丢失风险

### 后果
| ➕ 获得 | ➖ 牺牲 |
|---------|--------|
| 操作流畅，不打断上下文 | 弹窗内无法做复杂多步骤编辑 |
| 减少路由管理复杂度 | 若未来编辑字段扩展到 10+ 需重新决策 |
```

---

## 从 Skill 输出自动提取决策

当用户提供 Skill 输出时，自动识别其中隐含的决策：

### layout-optimizer → 决策提取

```
输入: "搜索区域从表格下方移至 Header 下方"
↓
提取决策:
- title: 搜索栏位置优化
- category: layout
- options: [搜索在表格下方, 搜索在 Header 下方, 左侧搜索栏]
- chosen: 搜索在 Header 下方
- reason: layout-optimizer 评分：信息架构 +3，用户体验 +3
```

### component-generator → 决策提取

```
输入: "SearchForm 作为自治组件，内部管理表单状态"
↓
提取决策:
- title: SearchForm 状态归属
- category: component
- options: [父组件传 Props 控制, 组件自治, Vuex 全局状态]
- chosen: 组件自治
- reason: 搜索条件仅在 SearchForm 内使用，不需要跨组件共享
```

---

## 工作步骤

1. **接收输入**：JSON 结构化数据 / 自然语言 / Skill 输出
2. **自动补全**：
   - 分配唯一 ID（读取已有最大 ID +1）
   - 未提供 `date` 时取当天
   - 未提供 `status` 时默认 `accepted`
   - 从 Skill 输出推断 `category` 和 `related_skill`
3. **生成记录**：按 ADR 模板格式化
4. **定位文件**：
   - 读取 `DECISIONS.md`（不存在则创建）
   - 按 ID 倒序追加到文件末尾
5. **关联检查**：若 `related_decisions` 引用了不存在的 ID，提醒用户
6. **输出确认**：展示新记录的摘要

---

## 示例

### 输入

```json
{
  "title": "表格排序使用后端排序",
  "category": "api",
  "context": "用户需要按姓名、注册时间排序，数据量 10 万级",
  "options": ["前端排序", "后端排序"],
  "chosen": "后端排序",
  "reason": "前端排序只能排当前页，无法做全局排序",
  "consequences": {
    "gain": ["全局排序准确", "支持多列组合排序"],
    "tradeoff": ["每次排序需请求后端"]
  },
  "author": "张三"
}
```

### 输出（追加到 DECISIONS.md）

```markdown
## D-003 · 表格排序使用后端排序

| 属性 | 内容 |
|------|------|
| **日期** | 2026-06-04 |
| **分类** | api |
| **状态** | ✅ accepted |
| **作者** | 张三 |

### 背景
用户需要按姓名、注册时间排序，数据量 10 万级。

### 可选方案

| 方案 | 评估 |
|------|------|
| A. 前端排序 | ❌ 只能排当前页 |
| B. 后端排序 | ✅ 全局排序，支持多列组合 |

### 最终选择
**B. 后端排序**

### 理由
前端排序只能排当前页数据，无法做全局排序。

### 后果
| ➕ 获得 | ➖ 牺牲 |
|---------|--------|
| 全局排序准确 | 每次排序需请求后端 |
| 支持多列组合排序 | — |
```

---

## 与 changelog-updater 联动

每次记录决策后，可自动生成对应的 CHANGELOG 精简条目：

```
decision-recorder: D-003 表格排序使用后端排序
        ↓ 自动联动
changelog-updater: [api] GET /api/users 新增 sortBy/sortOrder 参数 [minor]
```

---

## 注意事项

- **选项必须 ≥ 2 个**：决策意味着有选择，没有对比不构成决策
- **理由是核心**：不能说"因为好所以选"，要说清楚"好在哪、别的方案差在哪"
- **后果不能省**：每个决策都有 tradeoff，只说好处不说代价的记录没有价值
- **ID 唯一**：D-001, D-002... 顺序递增，不跳号，不重用
- **状态要维护**：被推翻的决策标记 `superseded` 并指向新决策，而非直接删除
- 本 Skill 聚焦 **为什么**（Why），`changelog-updater` 聚焦 **改了什么**（What），两者互补
