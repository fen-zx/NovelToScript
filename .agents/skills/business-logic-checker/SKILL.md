---

name: business-logic-checker
description: "对需求模型、设计文档、页面规格和API方案进行业务逻辑审查。发现权限缺失、状态流转问题、事务风险、数据一致性问题、AI流程问题和架构风险。"
argument-hint: "[RequirementAnalyzer输出 / Design文档 / PAGE_SPECS]"
user-invocable: true
--------------------

# 业务逻辑审查器 （BusinessLogicChecker）

## 目标

审查业务设计是否完整。

发现：

* 业务规则遗漏
* 权限问题
* 数据一致性问题
* 状态流转问题
* API缺失
* AI流程风险
* 队列风险
* 架构风险

输出系统级逻辑审查报告。

---

# 输入

支持：

```text
RequirementAnalyzer 输出

DesignGenerator 输出

PAGE_SPECS.md

API_SPECS.md
```

---

# 输出格式

Markdown

---

# 输出结构

```text
总体评分

业务规则检查

权限检查

状态流转检查

数据模型检查

事务检查

API检查

AI流程检查

异步任务检查

性能检查

安全检查

风险列表

改进建议
```

---

# 第一部分：总体评分

输出：

```markdown
# Business Logic Review

总评分：

86 / 100

风险等级：

Medium

问题数量：

7

严重问题：

2

建议：

通过修复后进入开发阶段
```

---

# 第二部分：业务规则检查

检查：

* 是否存在业务规则
* 是否完整
* 是否存在冲突

输出：

```markdown
# 业务规则检查

发现：

R-001 用户只能编辑自己的剧本

状态：

通过

---

发现：

删除剧本后如何处理版本

状态：

缺失

风险：

高
```

---

# 第三部分：权限检查

检查：

```text
谁可以做什么
```

审查：

* 创建
* 查看
* 修改
* 删除
* 导出
* 管理

输出：

```markdown
# 权限检查

功能：

删除剧本

定义：

Author

状态：

通过

---

功能：

导出PDF

权限：

未定义

状态：

风险
```

---

# 第四部分：状态流转检查

检查实体状态。

例如：

```text
Draft
Generating
Completed
Failed
Archived
```

检查：

* 是否定义状态
* 是否定义转换规则
* 是否存在死状态

输出：

```markdown
# 状态流转检查

Script

Draft
 ↓

Generating
 ↓

Completed

发现：

Failed状态无法恢复

风险：

中
```

---

# 第五部分：数据模型检查

检查：

* 实体关系
* 级联删除
* 数据归属

输出：

```markdown
# 数据模型检查

User

1:N

Script

通过

---

Script

1:N

Version

通过

---

问题：

删除Script后Version处理策略缺失

风险：

高
```

---

# 第六部分：事务检查

检查：

```text
多表写入
```

例如：

```text
创建剧本

Script
Version
Scene
```

检查：

```text
是否需要事务
```

输出：

```markdown
# 事务检查

场景：

创建剧本

涉及：

scripts

versions

scenes

建议：

数据库事务
```

---

# 第七部分：API检查

检查：

* CRUD是否完整
* 状态查询接口
* 分页接口
* 批量接口

输出：

```markdown
# API检查

发现：

GET /scripts

通过

---

发现：

POST /scripts

通过

---

问题：

缺少任务状态查询接口

建议：

GET /tasks/{id}
```

---

# 第八部分：AI流程检查

检查：

```text
LLM流程
```

例如：

```text
上传小说

↓

切块

↓

生成剧本

↓

校验YAML

↓

保存
```

检查：

* 输入
* 输出
* 重试
* 超时
* 失败处理

输出：

```markdown
# AI流程检查

问题：

生成失败处理缺失

建议：

增加重试机制

最大重试：

3次
```

---

# 第九部分：异步任务检查

检查：

```text
BullMQ
```

输出：

```markdown
# 异步任务检查

GenerateScriptJob

通过

---

ExportPdfJob

缺失

建议：

增加独立任务
```

---

# 第十部分：性能检查

检查：

* 分页
* 索引
* 缓存
* 查询复杂度

输出：

```markdown
# 性能检查

用户列表

分页：

通过

---

剧本列表

索引：

缺失

建议：

user_id

created_at

status
```

---

# 第十一部分：安全检查

检查：

* 权限
* 文件上传
* Prompt注入
* 越权访问

输出：

```markdown
# 安全检查

文件上传

问题：

未限制文件类型

风险：

高

建议：

仅允许txt/docx/pdf
```

---

# 第十二部分：风险列表

统一汇总。

输出：

```markdown
# 风险列表

RISK-001

删除剧本后Version处理策略缺失

等级：

High

---

RISK-002

导出PDF权限未定义

等级：

Medium

---

RISK-003

AI失败重试机制缺失

等级：

Medium
```

---

# 第十三部分：改进建议

输出：

```markdown
# 改进建议

1.

增加Script状态机

2.

增加任务状态查询接口

3.

增加BullMQ重试机制

4.

增加Redis缓存

5.

增加权限矩阵
```

---

# 审查规则

## 权限

必须检查：

```text
Create
Read
Update
Delete
Export
Manage
```

---

## 状态机

必须检查：

```text
初始状态

处理中

成功

失败

归档
```

---

## AI任务

必须检查：

```text
超时

重试

失败恢复

任务状态
```

---

## 数据库

必须检查：

```text
级联删除

唯一约束

索引
```

---

## API

必须检查：

```text
CRUD

分页

状态查询
```

---

# 工作步骤

Step1

读取需求模型

Step2

读取设计模型

Step3

构建业务流程图

Step4

检查权限

Step5

检查状态机

Step6

检查事务

Step7

检查AI流程

Step8

检查队列

Step9

检查性能

Step10

输出审查报告

---

# 强制要求

必须输出：

* 总评分
* 风险等级
* 风险列表
* 改进建议

必须标记：

High
Medium
Low

不得仅输出“通过”。

每个问题必须说明：

* 原因
* 风险
* 建议

发现缺失逻辑时必须指出。

禁止默认假设业务规则存在。
