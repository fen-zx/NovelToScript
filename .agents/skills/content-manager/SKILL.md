---
name: context-manager
description: "统一管理项目上下文，为所有 Skill 提供项目记忆能力。自动读取需求、设计、决策、页面规格、变更记录和项目状态，并生成当前任务所需上下文摘要，避免AI在多轮开发中遗忘历史信息。"
argument-hint: "[任务描述 / 当前需求]"
user-invocable: true
---

# 上下文管理器（ContextManager）

## 目标

统一管理项目长期记忆。

在任何 Skill 执行前：

* 自动读取项目文档
* 自动提取相关上下文
* 自动生成任务上下文摘要
* 自动发现冲突和重复开发

保证 AI 在长周期项目中保持一致性。

---

## 何时使用

必须在以下 Skill 之前执行：

* RequirementAnalyzer
* DesignGenerator
* BusinessLogicChecker
* AsciiLayoutGenerator
* LowFiPrototypeGenerator
* LayoutOptimizer
* ComponentGenerator
* PageGenerator
* ApiIntegrationGenerator
* TestGenerator
* CodeReviewer

---

## 管理文档

默认读取：

```text
project/

├── PRD.md
├── DESIGN.md
├── PAGE_SPECS.md
├── DECISIONS.md
├── CHANGELOG.md
├── PROJECT_STATE.md
├── API_SPECS.md
└── TASKS.md
```

---

## 输入格式

支持：

### 自然语言

```text
为用户管理页面增加批量删除功能
```

### JSON

```json
{
  "task": "为用户管理页面增加批量删除功能"
}
```

---

## 输出格式

Markdown

---

## 输出模板

```markdown
# 当前任务上下文

任务：

为用户管理页面增加批量删除功能

## 相关页面

- 用户管理

## 已有组件

- UserTable
- SearchForm
- UserPagination

## 已有接口

- GET /api/users
- PUT /api/users/{id}

## 历史决策

### D-003

决定：

用户列表使用服务端分页

原因：

数据量可能超过10万条

## 最近变更

2026-06-04

- 增加高级搜索
- 重构分页组件

## 当前项目状态

页面：

用户管理（完成）

组件：

UserTable（完成）

接口：

GET /api/users（完成）

## 风险提示

- 批量删除接口尚不存在
- 权限控制未定义
```

---

## 核心能力

### 能力1

任务关联分析

识别：

```text
任务
↓
页面
↓
组件
↓
接口
```

自动找到受影响范围。

---

### 能力2

决策继承

自动读取：

DECISIONS.md

例如：

```text
D-001

使用Ant Design
```

后续所有页面必须遵守。

---

### 能力3

变更追踪

自动读取：

CHANGELOG.md

避免：

```text
昨天删掉的功能
今天又加回来
```

---

### 能力4

状态感知

自动读取：

PROJECT_STATE.md

判断：

```text
已完成
开发中
未开始
```

避免重复开发。

---

### 能力5

接口感知

自动读取：

API_SPECS.md

发现：

```text
接口已存在
接口缺失
接口待修改
```

---

### 能力6

组件感知

自动识别：

```text
已有组件
可复用组件
待重构组件
```

优先复用。

---

## 上下文压缩规则

当项目超过100页文档时：

自动生成：

```markdown
# Context Summary

项目名称：

Admin System

技术栈：

React
TypeScript
Ant Design

页面数：

18

组件数：

73

接口数：

45

最近活跃页面：

- 用户管理
- 权限管理

最近决策：

- 服务端分页
- Zustand状态管理

最近变更：

- 搜索重构
- 表格性能优化
```

避免上下文过长。

---

## 工作步骤

### Step1

读取项目文档

### Step2

建立索引

页面
组件
接口
决策

### Step3

分析任务

识别：

* 影响页面
* 影响组件
* 影响接口

### Step4

提取相关上下文

过滤无关内容

### Step5

生成任务摘要

### Step6

输出风险提示

---

## 风险检测

自动发现：

### 重复开发

例如：

```text
组件已经存在
```

### 决策冲突

例如：

```text
历史要求Redux

当前任务要求Pinia
```

### 状态冲突

例如：

```text
任务要求新增页面

但页面已存在
```

### 接口冲突

例如：

```text
接口定义与历史版本不一致
```

---

## 强制要求

每个 Skill 执行前必须调用。

输出必须包含：

* 当前任务
* 相关页面
* 相关组件
* 相关接口
* 历史决策
* 最近变更
* 项目状态
* 风险提示

禁止直接开始生成代码。

必须先建立项目上下文。
