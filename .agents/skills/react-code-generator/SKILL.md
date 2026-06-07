---
name: react-code-generator
description: "根据页面规格、组件规格、API设计和架构文档生成 React + TypeScript 项目代码，包括页面、组件、Hooks、Store、API层、路由和类型定义。"
argument-hint: "[PAGE_SPECS.md / COMPONENT_SPECS.md / API_SPECS.md]"
user-invocable: true
---

# React Code Generator

## 目标

根据设计文档生成可运行的 React 代码。

输出内容包括：

- Pages
- Components
- Hooks
- API Layer
- Zustand Store
- Types
- Routes

最终生成：

```text
src/
```

目录结构。

---

# 默认技术栈

如果未指定：

```yaml
Framework: React

Language: TypeScript

Build Tool: Vite

Router: React Router

State: Zustand

Server State: TanStack Query

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
# ScriptEditorPage

组件：

SceneList

SceneEditor

CharacterPanel
```

---

## ComponentGenerator输出

```markdown
# SceneList

Props

scenes

selectedId

Events

onSelect
```

---

## API_SPECS

```yaml
GET /scripts/:id

POST /scripts

PUT /scripts/:id
```

---

# 输出结构

必须生成：

```text
目录结构

页面代码

组件代码

Hooks

API层

Store

Types

Routes

Query Keys

表单实现

错误处理
```

---

# 第一部分：项目目录

输出：

```text
src/

pages/

components/

hooks/

api/

store/

types/

routes/

utils/

constants/
```

---

# 第二部分：页面生成

根据 PAGE_SPECS 生成页面。

输出：

```tsx
export default function ScriptEditorPage() {

  return (
    <>
      <SceneList />
      <SceneEditor />
      <CharacterPanel />
    </>
  )

}
```

---

要求：

- TSX
- 函数组件
- Hooks写法

禁止：

```tsx
class Component
```

---

# 第三部分：组件生成

根据 COMPONENT_SPECS 生成。

输出：

```tsx
type Props = {

  scenes: Scene[]

  selectedId?: string

  onSelect: (id:string)=>void

}

export function SceneList(props:Props) {

  return <div />

}
```

---

要求：

必须生成：

```text
Props

Types

事件定义
```

---

# 第四部分：Types生成

自动生成：

```ts
export interface Script {

  id:string

  title:string

  status:string

}
```

来源：

- API DTO
- Prisma Schema
- Component Props

---

# 第五部分：API Layer

生成：

```text
src/api/
```

结构。

---

示例：

```ts
import { api } from "@/api/client"

export async function getScript(id:string){

  const res = await api.get(`/scripts/${id}`)

  return res.data

}
```

---

要求：

每个接口单独函数。

禁止：

```ts
fetch(...)
```

直接散落在页面中。

---

# 第六部分：Axios Client

生成：

```ts
import axios from "axios"

export const api = axios.create({

  baseURL:
    import.meta.env.VITE_API_URL

})
```

---

自动支持：

```text
JWT

Timeout

Interceptor
```

---

# 第七部分：TanStack Query

自动生成：

```ts
export function useScript(id:string){

  return useQuery({

    queryKey:["script",id],

    queryFn:()=>getScript(id)

  })

}
```

---

要求：

查询接口：

```text
useQuery
```

修改接口：

```text
useMutation
```

---

# 第八部分：Query Keys

统一生成：

```ts
export const queryKeys = {

  script:{

    detail:(id:string)=>["script",id],

    list:()=>["scripts"]

  }

}
```

---

禁止：

页面内硬编码：

```ts
["script"]
```

---

# 第九部分：Zustand Store

识别全局状态。

生成：

```ts
import { create } from "zustand"

type State = {

  selectedScriptId?:string

}

export const useAppStore =

create<State>(()=>({

}))
```

---

适用于：

```text
用户信息

主题

编辑器状态

选中项
```

---

禁止：

服务器数据放 Zustand。

服务器数据必须：

```text
TanStack Query
```

---

# 第十部分：React Hook Form

自动生成：

```ts
const form = useForm({

  resolver:zodResolver(schema)

})
```

---

要求：

表单：

```text
React Hook Form
```

校验：

```text
Zod
```

---

禁止：

```text
大量useState管理表单
```

---

# 第十一部分：路由生成

生成：

```ts
const router = createBrowserRouter([
])
```

---

示例：

```ts
{
  path:"/scripts",

  element:<ScriptPage />
}
```

---

# 第十二部分：Loading状态

自动生成：

```tsx
if(isLoading){

  return <Loading />
}
```

---

必须处理：

```text
Loading

Error

Empty
```

---

# 第十三部分：错误处理

生成：

```tsx
if(error){

  return (
    <ErrorState />
  )
}
```

---

API错误：

```ts
try {

}
catch(e){

}
```

---

# 第十四部分：权限控制

如果存在 RBAC。

生成：

```tsx
<PermissionGuard
  permission="script.edit"
>
```

---

自动识别：

```text
Admin

Author

Viewer
```

---

# 第十五部分：文件上传

如果页面存在上传。

生成：

```tsx
<input
 type="file"
/>
```

---

API：

```ts
FormData
```

---

支持：

```text
txt

pdf

docx
```

---

# 第十六部分：代码规范

必须：

```text
TypeScript Strict

ESLint

Prettier
```

---

组件：

```tsx
function Component()
```

---

禁止：

```tsx
any
```

除非无法推断。

---

# 第十七部分：AI项目特殊规则

如果检测到：

```text
Script

Novel

Scene

Character
```

实体。

自动生成：

```text
NovelUploadPage

ScriptEditorPage

CharacterPanel

GenerationStatus
```

推荐实现。

---

# 第十八部分：生成结果

必须输出：

```text
src/pages

src/components

src/api

src/hooks

src/store

src/types

src/routes
```

每个文件内容。

---

# 工作步骤

Step1

读取页面规格

Step2

读取组件规格

Step3

读取API规格

Step4

生成Types

Step5

生成API Layer

Step6

生成Hooks

Step7

生成Store

Step8

生成Components

Step9

生成Pages

Step10

生成Routes

Step11

生成错误处理

Step12

生成项目结构

---

# 强制要求

必须：

- TypeScript
- TanStack Query
- Zustand
- React Hook Form
- Zod

禁止：

- Class Component
- Redux
- MobX
- 页面直接请求API
- any泛滥

生成代码必须可编译。

未知字段标记：

TODO