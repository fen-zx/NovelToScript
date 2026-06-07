---
name: changelog-updater
description: '根据页面、组件、API 等修改记录自动生成和更新 CHANGELOG.md。用于项目迭代追溯、版本发布说明、团队协作记录。支持 JSON 输入和对话式记录，自动分类（页面/组件/API/布局/原型），标注影响级别（major/minor/patch），可生成对应 Git commit message。'
argument-hint: '[修改记录 JSON 或 文本描述]'
user-invocable: true
---

# Change Log 自动更新器（ChangeLogUpdater）

## 目标

自动维护项目 `CHANGELOG.md`，将每次开发迭代中的页面、组件、API、布局、原型变更记录为结构化、可追溯的变更历史，支持按日期、类型、影响级别快速检索。

## 何时使用

- 页面或组件修改完成，想留下记录
- API 对接方案调整后
- 原型或布局优化更新后
- 迭代结束，汇总本轮所有变更
- 发布前生成版本 Release Notes
- 给变更自动生成 Git commit message

## 输入

支持两种方式：

### 方式一：JSON 结构化输入

```json
{
  "changes": [
    {
      "item": "UserTable 组件",
      "category": "component",
      "change_type": "修改",
      "impact": "minor",
      "description": "增加分页功能，支持前端分页切换",
      "related_skill": "component-generator",
      "author": "张三",
      "date": "2026-06-04"
    }
  ]
}
```

### 方式二：自然语言对话

> "UserTable 组件增加了分页功能，SearchForm 新增状态下拉筛选，API 接口增加了 sortBy 参数"

Skill 会自动拆分为多条记录。

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `item` | ✅ | 修改的页面/组件/API/文件 |
| `category` | ✅ | 分类：`page` / `component` / `api` / `layout` / `prototype` / `config` / `other` |
| `change_type` | ✅ | `新增` / `修改` / `删除` / `修复` |
| `impact` | ✅ | `major`（破坏性变更）/ `minor`（功能变更）/ `patch`（修复/优化） |
| `description` | ✅ | 修改内容说明，一句话描述 |
| `related_skill` | — | 触发此次变更的 Skill（如 `layout-optimizer`） |
| `author` | — | 修改人，默认 `AI Assistant` |
| `date` | — | 修改日期，默认当天 |

---

## 输出格式

输出直接追加/更新项目根目录的 `CHANGELOG.md`：

```markdown
# CHANGELOG

## 2026-06-04

### 🔧 component (组件)
- **UserTable** — 增加分页功能，支持前端分页切换 `[patch]` @张三
- **SearchForm** — 新增状态下拉筛选 `[minor]` @张三

### 🔌 api (接口)
- **GET /api/users** — 查询参数新增 `sortBy` 和 `sortOrder` `[minor]` @李四

### 📐 layout (布局)
- **用户管理页** — 搜索区域从表格下方移至 Header 下方 `[minor]` @AI Assistant

---

## 2026-06-03

### 🆕 page (页面)
- **用户管理页面** — 初始化页面结构，包含列表、搜索、编辑功能 `[major]` @张三
```

---

## 分类与图标映射

| category | 图标 | 说明 |
|----------|------|------|
| `page` | 🆕 | 页面级变更 |
| `component` | 🔧 | 组件级变更 |
| `api` | 🔌 | 接口/数据变更 |
| `layout` | 📐 | 布局结构调整 |
| `prototype` | 🎨 | 原型/设计变更 |
| `config` | ⚙️ | 配置/路由/构建变更 |
| `other` | 📝 | 文档/其他 |

---

## 影响级别

| impact | 标记 | 说明 | 示例 |
|--------|------|------|------|
| `major` | `[major]` | 破坏性变更，需同步通知团队 | 接口响应结构重构、路由重命名 |
| `minor` | `[minor]` | 新增功能，向后兼容 | 新增搜索字段、新增组件 |
| `patch` | `[patch]` | 修复/优化，无功能变化 | 样式微调、文案修正、性能优化 |

---

## 工作步骤

1. **接收记录**：解析 JSON 或从对话中提取变更信息
2. **补全字段**：自动填充 `date`（当天）、缺失的 `category` 和 `impact`
3. **定位条目**：
   - 读取项目根目录 `CHANGELOG.md`
   - 若不存在，创建新文件含 `# CHANGELOG` 标题
   - 查找是否已有当天日期 `## YYYY-MM-DD`
4. **追加/新建**：
   - 若当天条目存在 → 在对应 `category` 分组下追加
   - 若当天条目不存在 → 新建日期标题 + 各 category 分组
5. **按分类排序**：同一天内按 page → component → api → layout → prototype → config → other 排序
6. **去重检查**：若同一天同一 item 已有完全相同的 description，跳过
7. **输出确认**：展示新增的条目和更新后的当天分组

---

## 示例

### 输入

```json
{
  "changes": [
    {
      "item": "UserTable 组件",
      "category": "component",
      "change_type": "修改",
      "impact": "minor",
      "description": "增加排序功能，支持点击列头升降序"
    },
    {
      "item": "GET /api/users",
      "category": "api",
      "change_type": "修改",
      "impact": "minor",
      "description": "新增 sortBy、sortOrder 查询参数"
    },
    {
      "item": "用户管理页布局",
      "category": "layout",
      "change_type": "修改",
      "impact": "patch",
      "description": "搜索栏移至表格上方，优化操作路径"
    }
  ]
}
```

### 输出（追加到 CHANGELOG.md）

```markdown
## 2026-06-04

### 🔧 component
- **UserTable 组件** — 增加排序功能，支持点击列头升降序 `[minor]` @AI Assistant

### 🔌 api
- **GET /api/users** — 新增 sortBy、sortOrder 查询参数 `[minor]` @AI Assistant

### 📐 layout
- **用户管理页布局** — 搜索栏移至表格上方，优化操作路径 `[patch]` @AI Assistant
```

---

## 批量汇总模式

当用户输入"汇总本轮变更"或提供多项 Skill 输出时，自动从对话上下文中提取所有变更点：

```
从上下文中检测到以下变更：
1. [component] UserTable — 增加分页功能 [minor]
2. [component] SearchForm — 新增状态下拉 [minor]
3. [api] GET /api/users — 新增 sortBy 参数 [minor]
4. [layout] 用户管理 — 搜索区域上移 [minor]

确认追加到 CHANGELOG.md？(y/n)
```

---

## Git Commit Message 生成

每次记录变更后，可附带生成建议的 commit message：

```
建议 commit message:

feat(UserTable): 增加排序和分页功能
feat(api): /api/users 新增 sortBy/sortOrder 参数
refactor(layout): 用户管理页搜索栏位置上移
```

格式：`{type}({scope}): {description}`

| change_type | commit type |
|-------------|-------------|
| 新增 | `feat` |
| 修改 | `refactor` / `feat` |
| 删除 | `chore` |
| 修复 | `fix` |

---

## 注意事项

- **必须去重**：同一天、同一 item、同一 description 不得重复记录
- **日期取当天**：若 JSON 未提供 `date`，默认使用当前日期
- **作者默认值**：未提供 `author` 时标注 `@AI Assistant`
- **分类强制**：`category` 必须是预定义的 7 种之一，否则归入 `other`
- **不丢失历史**：只追加不覆盖已有条目
- **与 Skill 链联动**：若 `related_skill` 有值，说明该变更由哪个 Skill 触发（如 `layout-optimizer` → 布局变更）
