---
name: frontend-architecture-generator
description: "根据页面设计、组件设计和API设计生成前端架构方案，包括目录结构、路由设计、组件分层、状态管理、数据流、权限控制和工程规范。"
argument-hint: "[PAGE_SPECS.md / COMPONENT_SPECS.md / API_SPECS.md]"
user-invocable: true
---

# Frontend Architecture Generator

## 目标

根据产品设计和页面设计生成前端架构方案。

输出内容用于：

- ReactCodeGenerator
- 项目初始化
- 团队开发规范
- 组件设计规范

最终生成：

前端架构蓝图。

---

# 默认技术栈

如果未指定：

```yaml
Framework: React

Language: TypeScript

Build Tool: Vite

Router: React Router

Server State: TanStack Query

Client State: Zustand

Form: React Hook Form

Validation: Zod

UI: Shadcn UI

HTTP: Axios
```

---

# 输入

支持：

## PageGenerator输出

```markdown
Pages

NovelPage

ScriptPage

EditorPage
```

---

## ComponentGenerator输出

```markdown
Components

SceneList

SceneEditor

CharacterPanel
```

---

## API_SPECS

```yaml
GET /scripts

GET /scripts/:id

POST /scripts
```

---

# 输出结构

必须包含：

```text
项目结构

路由结构

组件架构

状态管理架构

API层设计

Hook设计

权限架构

数据流设计

错误处理策略

工程规范

性能优化建议
```

---

# 第一部分：项目结构

生成推荐目录。

输出：

```text
src/

app/

pages/

components/

features/

hooks/

api/

store/

routes/

types/

utils/

constants/

providers/
```

---

# 第二部分：组件分层

自动划分：

```text
UI组件

业务组件

页面组件
```

---

输出：

```text
components/

ui/

Button

Input

Dialog

features/

script/

SceneList

SceneEditor

CharacterPanel
```

---

说明：

```markdown
UI组件

纯展示

可复用

---

Feature组件

业务逻辑

领域相关
```

---

# 第三部分：页面架构

输出：

```text
pages/

NovelPage

ScriptPage

ScriptEditorPage

ExportPage
```

---

页面职责：

```markdown
ScriptEditorPage

负责：

加载剧本

管理页面状态

组合业务组件
```

---

禁止：

```text
页面内直接实现复杂业务逻辑
```

---

# 第四部分：路由设计

输出：

```text
/

/novels

/scripts

/scripts/:id

/export
```

---

生成：

```ts
createBrowserRouter()
```

结构建议。

---

# 第五部分：状态管理架构

自动区分：

```text
Server State

Client State
```

---

Server State

使用：

```text
TanStack Query
```

管理：

```text
API数据

列表

详情

分页
```

---

Client State

使用：

```text
Zustand
```

管理：

```text
用户设置

主题

编辑器状态

选中状态
```

---

禁止：

```text
API数据放Zustand
```

---

# 第六部分：API层设计

输出：

```text
api/

client.ts

script.api.ts

novel.api.ts

user.api.ts
```

---

要求：

```text
所有HTTP请求集中管理
```

---

禁止：

```text
页面直接axios.get()
```

---

# 第七部分：Hook架构

输出：

```text
hooks/

useScript.ts

useScripts.ts

useGenerateScript.ts
```

---

分类：

```text
Query Hooks

Mutation Hooks

UI Hooks
```

---

示例：

```text
useScript()

useGenerateScript()

useSidebar()
```

---

# 第八部分：数据流设计

输出：

```text
API

↓

TanStack Query

↓

Feature Component

↓

Page
```

---

禁止：

```text
API

↓

Page

↓

Component
```

直接耦合。

---

# 第九部分：权限架构

识别角色。

输出：

```text
Admin

Author

Viewer
```

---

生成：

```text
PermissionGuard

RequireAuth
```

组件建议。

---

路由权限：

```text
/scripts

需要登录

/export

需要导出权限
```

---

# 第十部分：表单架构

统一：

```text
React Hook Form

+
Zod
```

---

禁止：

```text
大型表单全部使用useState
```

---

输出：

```text
forms/

ScriptForm

NovelUploadForm
```

---

# 第十一部分：错误处理

统一：

```text
ErrorBoundary
```

---

API错误：

```text
Toast

ErrorPage
```

---

必须处理：

```text
Loading

Empty

Error
```

---

# 第十二部分：文件上传架构

如果检测到上传需求。

生成：

```text
UploadService

UploadHook

UploadComponent
```

---

支持：

```text
txt

pdf

docx
```

---

# 第十三部分：AI项目特殊设计

如果检测到：

```text
Novel

Script

Scene

Character
```

实体。

生成建议：

```text
features/

novel/

script/

character/

generation/
```

---

组件建议：

```text
NovelUploader

GenerationStatus

ScriptEditor

CharacterPanel
```

---

# 第十四部分：性能优化

检查：

```text
组件过大

重复渲染

状态污染
```

---

输出：

```markdown
建议：

SceneEditor使用React.memo

列表使用虚拟滚动

大对象避免放Store
```

---

# 第十五部分：工程规范

统一：

```text
ESLint

Prettier

Husky

Lint Staged
```

---

命名规范：

```text
Page

PascalCase

Component

PascalCase

Hook

useXxx

Store

useXxxStore
```

---

文件命名：

```text
script.api.ts

script.store.ts

useScript.ts
```

---

# 第十六部分：推荐目录

最终输出：

```text
src/

app/

pages/

components/

ui/

features/

script/

novel/

character/

hooks/

api/

store/

types/

routes/

providers/

utils/

constants/
```

---

# 工作步骤

Step1

读取页面规格

Step2

读取组件规格

Step3

读取API设计

Step4

设计目录结构

Step5

设计路由

Step6

设计组件层级

Step7

设计状态管理

Step8

设计Hook架构

Step9

设计权限系统

Step10

设计数据流

Step11

设计工程规范

Step12

输出架构方案

---

# 强制要求

必须输出：

- 项目结构
- 路由设计
- 组件架构
- 状态管理
- API层设计
- Hook设计
- 权限设计
- 数据流设计
- 工程规范

禁止：

- 直接生成业务代码
- Redux
- MobX
- 页面直接请求API

推荐：

- TanStack Query
- Zustand
- React Hook Form
- Zod

未知内容统一标记：

[待确认]