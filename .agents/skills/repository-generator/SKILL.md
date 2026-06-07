---
name: repository-generator
description: "根据数据库模型和Service设计生成Repository层设计文档，包括Repository职责、查询方法、分页规范、事务边界、Prisma实现建议和性能优化策略。"
argument-hint: "[DATABASE_SCHEMA.md / SERVICE_SPECS.md]"
user-invocable: true
---

# Repository Generator

## 目标

生成Repository层设计。

用于：

- Prisma实现
- BackendCodeGenerator
- 数据访问规范
- 查询优化

输出：

```text
REPOSITORY_SPECS.md
```

---

# Repository职责

Repository负责：

```text
数据库访问

CRUD

分页

筛选

排序

关联查询
```

---

禁止：

```text
业务逻辑

权限校验

AI调用

BullMQ

Redis缓存

HTTP处理
```

---

# 输入

支持：

## DATABASE_SCHEMA

```text
User

Novel

Script

Version

Scene

Task
```

---

## SERVICE_SPECS

```text
ScriptService

createScript

generateScript

saveVersion
```

---

# 输出结构

必须包含：

```text
Repository列表

职责说明

CRUD方法

分页规范

筛选规范

排序规范

事务边界

Prisma实现建议

索引建议

风险分析
```

---

# 第一部分：Repository识别

根据实体生成。

输出：

```markdown
# Repositories

UserRepository

NovelRepository

ScriptRepository

VersionRepository

SceneRepository

TaskRepository
```

---

# 第二部分：职责定义

输出：

```markdown
# ScriptRepository

职责：

Script表访问

Script关联查询

Script分页查询
```

---

# 第三部分：CRUD设计

输出：

```markdown
# ScriptRepository

findById(id)

findMany(query)

create(data)

update(id,data)

delete(id)
```

---

标准方法：

```text
findById

findMany

create

update

delete

count
```

---

# 第四部分：分页规范

统一：

```ts
interface Pagination {

  page:number

  pageSize:number

}
```

---

Prisma建议：

```ts
skip

take
```

---

输出：

```markdown
# Pagination

默认：

pageSize=20

最大：

pageSize=100
```

---

# 第五部分：筛选规范

自动识别：

```text
status

title

userId

createdAt
```

---

输出：

```ts
interface ScriptFilter {

  status?:string

  userId?:string

  keyword?:string

}
```

---

Prisma建议：

```ts
where
```

---

# 第六部分：排序规范

输出：

```ts
orderBy:{
  createdAt:"desc"
}
```

---

支持：

```text
createdAt

updatedAt

title
```

---

默认：

```text
createdAt DESC
```

---

# 第七部分：关联查询

识别关系。

输出：

```markdown
# ScriptRepository

关联：

Version

Scene
```

---

Prisma建议：

```ts
include:{
  versions:true
}
```

---

避免：

```text
N+1查询
```

---

# 第八部分：事务边界

说明哪些操作必须在Service事务中执行。

输出：

```markdown
# Transaction Boundary

createScript

Repository：

不启动事务

Service：

负责事务
```

---

禁止：

```ts
Repository内部开启复杂事务
```

---

# 第九部分：Prisma实现建议

生成：

```ts
class ScriptRepository {

  async findById(id:string){

    return prisma.script.findUnique({
      where:{id}
    })

  }

}
```

---

统一：

```text
PrismaClient
```

---

禁止：

```text
原生SQL优先
```

除非性能瓶颈。

---

# 第十部分：查询优化

检查：

```text
分页

模糊搜索

关联查询
```

---

输出：

```markdown
# Query Optimization

Script列表

增加：

status索引

createdAt索引
```

---

# 第十一部分：软删除策略

如果存在：

```text
deletedAt
```

---

自动生成：

```ts
where:{
  deletedAt:null
}
```

---

输出：

```markdown
# Soft Delete

默认过滤已删除数据
```

---

# 第十二部分：缓存边界

说明：

```markdown
Repository

不负责缓存
```

---

缓存归属：

```text
Service
```

---

禁止：

```text
Repository直接操作Redis
```

---

# 第十三部分：Service依赖关系

输出：

```markdown
# Dependencies

ScriptService

↓

ScriptRepository

VersionRepository
```

---

```markdown
TaskService

↓

TaskRepository
```

---

# 第十四部分：AI剧本工具特殊规则

发现：

```text
Novel

Script

Scene

Version

Character
```

---

必须生成：

```markdown
NovelRepository

ScriptRepository

VersionRepository

SceneRepository

CharacterRepository

TaskRepository
```

---

ScriptRepository额外包含：

```text
findByUserId

findByStatus

findWithVersions

findWithScenes
```

---

VersionRepository额外包含：

```text
findLatestVersion

findByScriptId
```

---

TaskRepository额外包含：

```text
findPendingTasks

findFailedTasks
```

---

# 第十五部分：性能分析

检查：

```text
大表

频繁查询

排序

分页
```

---

输出：

```markdown
发现：

Script按状态查询

建议：

@@index([status])
```

---

```markdown
发现：

Task按时间排序

建议：

@@index([createdAt])
```

---

# 第十六部分：风险分析

输出：

```markdown
RISK-001

N+1查询风险

等级：

High

建议：

include查询
```

---

```markdown
RISK-002

分页缺失

等级：

Medium

建议：

统一Pagination
```

---

# Repository规范

所有Repository必须包含：

```ts
findById()

findMany()

create()

update()

delete()

count()
```

---

命名：

```text
UserRepository

ScriptRepository

NovelRepository
```

---

禁止：

```text
UserDao

ScriptDao
```

---

# 工作步骤

Step1

读取数据库模型

Step2

读取Service设计

Step3

生成Repository列表

Step4

生成CRUD方法

Step5

生成分页规范

Step6

生成筛选规范

Step7

生成关联查询

Step8

生成事务边界

Step9

生成Prisma建议

Step10

生成优化建议

Step11

生成风险分析

---

# 强制要求

必须输出：

- Repository列表
- CRUD设计
- 分页规范
- 筛选规范
- 排序规范
- 关联查询
- Prisma实现建议
- 优化建议
- 风险分析

禁止：

- 业务逻辑
- 权限逻辑
- Redis
- BullMQ
- AI调用

未知内容统一标记：

[待确认]