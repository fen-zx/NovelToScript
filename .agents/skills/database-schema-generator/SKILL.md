---
name: database-schema-generator
description: "根据需求模型和后端架构设计生成数据库设计方案，包括ER模型、Prisma Schema、关系设计、索引设计、约束设计、审计字段、软删除策略、迁移计划和性能优化建议。"
argument-hint: "[RequirementAnalyzer输出 / BackendArchitectureGenerator输出 / JSON]"
user-invocable: true
---

# Database Schema Generator

## 目标

根据需求模型和架构设计生成数据库设计方案。

输出结果用于：

- Prisma Schema
- SQLite数据库设计
- Migration规划
- API设计
- Repository设计

最终生成可直接用于开发的数据库模型。

---

# 适用场景

适用于：

- Prisma
- SQLite
- PostgreSQL
- MySQL

优先针对：

```text
Express
Prisma
SQLite
```

项目。

---

# 输入格式

支持：

## 方式1

RequirementAnalyzer输出

```markdown
# 实体

User
Script
Version
Scene
```

---

## 方式2

BackendArchitectureGenerator输出

```markdown
# Domain Model

User
 └── Script
       └── Version
```

---

## 方式3

JSON

```json
{
  "entities": [
    "User",
    "Script"
  ]
}
```

---

# 输出格式

默认：

Markdown

用户要求JSON时：

输出结构化JSON。

---

# 输出结构

必须包含：

```text
实体分析

ER模型

实体关系

Prisma Schema

枚举设计

索引设计

唯一约束

外键设计

审计字段

软删除策略

SQLite兼容性检查

Migration计划

性能优化建议

风险分析
```

---

# 第一部分：实体分析

识别所有实体。

输出：

```markdown
# Entity Analysis

## User

职责：

系统用户

字段：

- id
- email
- nickname

---

## Script

职责：

剧本

字段：

- id
- title
- status
```

---

# 第二部分：ER模型

生成ER关系。

输出：

```text
User
 |
 | 1:N
 |
Script
 |
 | 1:N
 |
Version
 |
 | 1:N
 |
Scene
```

---

# 第三部分：实体关系

输出：

```markdown
# Relationships

User

1:N

Script

---

Script

1:N

Version

---

Version

1:N

Scene
```

必须标注：

```text
1:1
1:N
N:N
```

---

# 第四部分：Prisma Schema

必须生成完整Prisma模型。

示例：

```prisma
model User {

  id String @id @default(cuid())

  email String @unique

  nickname String?

  scripts Script[]

  createdAt DateTime @default(now())

  updatedAt DateTime @updatedAt

}
```

---

每个实体必须包含：

```prisma
id

createdAt

updatedAt
```

除非需求明确说明不需要。

---

# 第五部分：枚举设计

自动识别状态字段。

输出：

```prisma
enum ScriptStatus {

  DRAFT

  GENERATING

  COMPLETED

  FAILED

  ARCHIVED

}
```

---

输出说明：

```markdown
# Enum Design

ScriptStatus

用于：

Script.status
```

---

# 第六部分：索引设计

自动识别查询热点。

输出：

```prisma
model Script {

  userId String

  status ScriptStatus

  createdAt DateTime

  @@index([userId])

  @@index([status])

  @@index([createdAt])

}
```

---

说明：

```markdown
# Index Design

userId

原因：

按用户查询剧本

---

status

原因：

按状态过滤
```

---

# 第七部分：唯一约束

自动识别唯一字段。

输出：

```prisma
email String @unique
```

或：

```prisma
@@unique([userId, title])
```

---

说明：

```markdown
# Unique Constraints

users.email

原因：

用户唯一邮箱
```

---

# 第八部分：外键设计

输出：

```prisma
model Script {

  userId String

  user User @relation(
    fields: [userId],
    references: [id]
  )

}
```

---

说明：

```markdown
# Foreign Keys

Script.userId

引用：

User.id
```

---

# 第九部分：审计字段

所有业务实体默认包含：

```prisma
createdAt DateTime @default(now())

updatedAt DateTime @updatedAt
```

---

输出：

```markdown
# Audit Fields

createdAt

updatedAt
```

---

# 第十部分：软删除策略

根据需求判断。

推荐：

```prisma
deletedAt DateTime?
```

---

输出：

```markdown
# Soft Delete

Script

启用

字段：

deletedAt
```

---

如果不需要：

```markdown
# Soft Delete

未启用

原因：

数据允许永久删除
```

---

# 第十一部分：SQLite兼容性检查

检查：

- JSON字段
- Decimal字段
- Array字段
- 全文搜索

输出：

```markdown
# SQLite Compatibility

状态：

通过

问题：

无
```

或：

```markdown
问题：

SQLite不支持数组类型

建议：

改用JSON字段
```

---

# 第十二部分：Migration计划

生成迁移顺序。

输出：

```markdown
# Migration Plan

Migration 001

users

---

Migration 002

scripts

---

Migration 003

versions

---

Migration 004

scenes
```

---

同时输出：

```bash
npx prisma migrate dev --name init_users

npx prisma migrate dev --name add_scripts

npx prisma migrate dev --name add_versions
```

---

# 第十三部分：性能优化建议

检查：

- 缺失索引
- 大表风险
- 全表扫描
- 频繁JOIN

输出：

```markdown
# Performance Suggestions

发现：

Script按状态查询

建议：

@@index([status])

---

发现：

Task按时间排序

建议：

@@index([createdAt])
```

---

# 第十四部分：风险分析

发现：

- 数据一致性问题
- 删除策略缺失
- 索引缺失
- N+1查询风险

输出：

```markdown
# Risks

RISK-001

Script删除策略未定义

等级：

High

建议：

增加软删除

---

RISK-002

缺少状态索引

等级：

Medium

建议：

增加@@index([status])
```

---

# Prisma生成规则

必须遵循：

## 主键

统一：

```prisma
id String @id @default(cuid())
```

---

## 时间字段

统一：

```prisma
createdAt DateTime @default(now())

updatedAt DateTime @updatedAt
```

---

## 枚举

优先使用：

```prisma
enum
```

而不是：

```prisma
String
```

---

## 关系

必须使用：

```prisma
@relation
```

---

## 索引

查询字段必须生成：

```prisma
@@index
```

---

# 工作步骤

Step1

读取实体模型

Step2

识别实体关系

Step3

生成ER模型

Step4

生成Prisma模型

Step5

生成枚举

Step6

生成索引

Step7

生成约束

Step8

检查SQLite兼容性

Step9

生成Migration计划

Step10

生成风险分析

---

# 强制要求

必须输出：

- ER模型
- Prisma Schema
- 索引设计
- 约束设计
- Migration计划
- 风险分析

Prisma Schema必须完整。

不得只输出表结构描述。

未知内容统一标记：

[待确认]

风险等级统一使用：

High
Medium
Low

禁止：

- 跳过Prisma Schema
- 省略关系定义
- 省略索引设计
- 凭空创造业务字段