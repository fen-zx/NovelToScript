---

name: requirement-analyzer
description: "将自然语言需求解析为完整的产品需求模型，包括页面、模块、功能、实体、业务规则、权限、接口需求、AI能力和异步任务。作为整个AI开发流程的入口。"
argument-hint: "[需求文本 / PRD / 用户故事 / JSON]"
user-invocable: true
--------------------

# 需求解析器 （RequirementAnalyzer）

## 目标

将非结构化需求转换为结构化需求模型。

输出不仅面向前端页面设计，同时服务于：

* 产品设计
* 页面设计
* API设计
* 数据库设计
* AI工作流设计
* 队列设计
* 权限设计

---

# 输出结构

统一生成以下内容：

```text
需求概览

页面模型
模块模型
功能模型
数据字段

实体模型
业务规则

权限模型

接口需求

AI能力

异步任务

疑问列表
```

---

# 输入格式

支持：

## 方式1

自然语言

```text
用户上传小说后可以生成剧本。
生成过程较长，需要后台异步执行。
用户可以查看生成历史并导出PDF。
```

---

## 方式2

JSON

```json
{
  "raw_requirement": "用户上传小说后可以生成剧本"
}
```

---

# 输出格式

默认：

Markdown

用户要求：

JSON

则输出结构化JSON。

---

# 第一部分：需求概览

输出：

```markdown
# 需求概览

目标：

帮助作者将小说转换为剧本。

主要角色：

- Author
- Admin

核心能力：

- 上传小说
- AI生成剧本
- 编辑剧本
- 导出PDF
```

---

# 第二部分：页面模型

识别所有页面。

输出：

```markdown
# 页面

## 小说管理

## 剧本管理

## 剧本编辑器

## 导出中心
```

---

# 第三部分：模块模型

每个页面拆分模块。

输出：

```markdown
# 页面：剧本管理

## 模块：搜索区

## 模块：剧本列表

## 模块：分页器

## 模块：批量操作
```

---

# 第四部分：功能模型

每个模块对应功能。

输出：

```markdown
## 功能

- 查看剧本
- 搜索剧本
- 编辑剧本
- 删除剧本
- 导出剧本
```

---

# 第五部分：数据字段

提取所有字段。

输出：

```markdown
## 数据字段

Script

- id
- title
- status
- createdAt

User

- id
- email
- nickname
```

---

# 第六部分：实体模型（新增）

识别业务实体。

输出：

```markdown
# 实体模型

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
- content
- status
```

---

# 第七部分：实体关系（新增）

输出：

```markdown
# 实体关系

User
 └── Script

Script
 └── Version

Version
 └── Scene
```

并同时生成：

```text
User 1:N Script

Script 1:N Version

Version 1:N Scene
```

---

# 第八部分：业务规则（新增）

提取业务规则。

输出：

```markdown
# 业务规则

R-001

用户只能编辑自己的剧本

R-002

删除剧本时同步删除版本

R-003

导出前必须生成成功
```

规则编号必须唯一。

---

# 第九部分：权限模型（新增）

识别角色和权限。

输出：

```markdown
# 权限模型

Author

- 创建剧本
- 编辑自己的剧本
- 删除自己的剧本

Admin

- 管理全部剧本
```

---

# 第十部分：接口需求（新增）

从需求推导API。

输出：

```markdown
# API需求

POST /scripts

GET /scripts

GET /scripts/:id

PUT /scripts/:id

DELETE /scripts/:id
```

仅输出需求级接口。

不设计参数。

---

# 第十一部分：AI能力（新增）

识别AI相关功能。

输出：

```markdown
# AI能力

## 小说解析

输入：

Novel

输出：

Structured Novel

---

## 剧本生成

输入：

Novel

输出：

Screenplay YAML
```

---

# 第十二部分：异步任务（新增）

识别耗时操作。

输出：

```markdown
# 异步任务

GenerateScriptJob

输入：

novelId

输出：

scriptId

状态：

Pending
Processing
Completed
Failed
```

---

# 第十三部分：外部资源（新增）

识别：

```text
文件
对象存储
第三方服务
```

输出：

```markdown
# 外部资源

MinIO

用途：

存储小说文件

---

DeepSeek API

用途：

生成剧本
```

---

# 第十四部分：风险分析（新增）

自动发现风险。

输出：

```markdown
# 风险分析

风险：

生成剧本耗时过长

建议：

使用BullMQ异步处理

---

风险：

导出PDF占用资源

建议：

后台任务执行
```

---

# 第十五部分：疑问列表

必须生成。

输出：

```markdown
# 疑问列表

1. 是否支持多人协作编辑？

2. 导出格式是否包含Word？

3. AI生成失败后是否允许重试？

4. 剧本是否需要版本管理？
```

---

# 工作步骤

Step1

识别角色

---

Step2

识别页面

---

Step3

识别实体

---

Step4

识别业务规则

---

Step5

识别权限

---

Step6

识别API需求

---

Step7

识别AI能力

---

Step8

识别异步任务

---

Step9

生成风险分析

---

Step10

生成疑问列表

---

# 强制要求

必须输出：

* 页面模型
* 模块模型
* 功能模型
* 数据字段
* 实体模型
* 实体关系
* 业务规则
* 权限模型
* API需求
* AI能力
* 异步任务
* 风险分析
* 疑问列表

不得直接跳过任何章节。

未知内容统一标记：

[待确认]

禁止凭空捏造字段。
