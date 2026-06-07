---
name: queue-design-generator
description: "根据业务逻辑、API设计和Service设计生成BullMQ队列架构，包括Queue、Job、Worker、重试策略、超时策略、任务状态机和监控设计。"
argument-hint: "[SERVICE_SPECS.md / API_SPECS.md / BUSINESS_LOGIC.md]"
user-invocable: true
---

# Queue Design Generator

## 目标

识别系统中的异步任务。

生成：

```text
QUEUE_SPECS.md
```

用于：

- BullMQ
- Worker设计
- AI任务处理
- 导出任务处理
- 后端代码生成

---

# 队列职责

适用于：

```text
AI生成

文件导出

上传解析

批量任务

耗时操作
```

---

不适用于：

```text
CRUD

简单查询

同步业务
```

---

# 输入

支持：

## API设计

```yaml
POST /scripts/generate

POST /export/pdf
```

---

## Service设计

```text
generateScript()

exportPdf()

analyzeNovel()
```

---

## 业务逻辑

```text
上传小说

分析角色

生成剧本

导出PDF
```

---

# 输出结构

必须包含：

```text
Queue列表

Job设计

Worker设计

状态机

重试策略

超时策略

优先级策略

Redis设计

监控设计

风险分析
```

---

# 第一部分：队列识别

自动识别耗时任务。

输出：

```markdown
# Queues

generate-script

export-pdf

cleanup-temp
```

---

# 第二部分：Queue职责

输出：

```markdown
# generate-script

职责：

生成剧本

角色分析

场景生成

YAML生成
```

---

```markdown
# export-pdf

职责：

PDF导出
```

---

# 第三部分：Job设计

输出：

```ts
interface GenerateScriptJob {

  taskId:string

  userId:string

  novelId:string

}
```

---

```ts
interface ExportPdfJob {

  taskId:string

  scriptId:string

}
```

---

要求：

Job字段必须来源于业务。

禁止虚构字段。

---

# 第四部分：Worker设计

输出：

```markdown
GenerateScriptWorker

负责：

调用AI

生成剧本

保存结果
```

---

```markdown
ExportPdfWorker

负责：

生成PDF

上传MinIO
```

---

# 第五部分：状态机

统一：

```text
PENDING

↓

PROCESSING

↓

COMPLETED
```

---

失败：

```text
PROCESSING

↓

FAILED
```

---

输出：

```markdown
# Task Status

PENDING

PROCESSING

COMPLETED

FAILED

CANCELLED
```

---

# 第六部分：重试策略

输出：

```markdown
# Retry Policy

generate-script

最大重试：

3次
```

---

```markdown
重试间隔：

指数退避
```

---

BullMQ建议：

```ts
attempts:3
```

---

# 第七部分：超时策略

输出：

```markdown
# Timeout

generate-script

600秒
```

---

```markdown
export-pdf

120秒
```

---

超时后：

```text
FAILED
```

---

# 第八部分：优先级策略

输出：

```markdown
Priority

HIGH

用户主动生成剧本

MEDIUM

导出

LOW

清理任务
```

---

BullMQ建议：

```ts
priority
```

---

# 第九部分：Redis设计

输出：

```markdown
Redis用途

BullMQ

缓存

任务状态
```

---

Key建议：

```text
task:{id}

script:{id}
```

---

# 第十部分：任务表设计

自动生成建议。

输出：

```ts
Task {

  id

  type

  status

  progress

  error

}
```

---

建议存储：

```text
SQLite
```

---

# 第十一部分：监控设计

输出：

```markdown
监控项

任务数量

失败率

平均耗时

队列长度
```

---

推荐：

```text
Bull Board
```

---

# 第十二部分：AI项目特殊规则

发现：

```text
Novel

Script

Character

Scene
```

实体时。

必须生成：

```markdown
generate-script

analyze-character

generate-scene

export-pdf
```

---

推荐流程：

```text
generate-script

↓

analyze-character

↓

generate-scene

↓

save-script
```

---

# 第十三部分：异常处理

输出：

```markdown
AI_TIMEOUT

AI_RESPONSE_INVALID

EXPORT_FAILED

TASK_NOT_FOUND
```

---

建议：

```text
记录日志

允许重试

保存错误原因
```

---

# 第十四部分：性能分析

检查：

```text
队列堆积

长任务

重复任务
```

---

输出：

```markdown
发现：

剧本生成耗时较长

建议：

拆分子任务
```

---

# 第十五部分：风险分析

输出：

```markdown
RISK-001

AI接口超时

等级：

High

建议：

BullMQ重试
```

---

```markdown
RISK-002

导出失败

等级：

Medium

建议：

失败任务保留
```

---

# BullMQ规范

统一：

```ts
Queue

Worker

Job
```

---

禁止：

```text
直接setTimeout实现队列
```

---

必须支持：

```text
重试

超时

优先级

进度更新
```

---

# 工作步骤

Step1

读取业务逻辑

Step2

识别耗时任务

Step3

生成Queue

Step4

生成Job

Step5

生成Worker

Step6

设计状态机

Step7

设计重试

Step8

设计超时

Step9

设计监控

Step10

输出风险分析

---

# 强制要求

必须输出：

- Queue列表
- Job设计
- Worker设计
- 状态机
- 重试策略
- 超时策略
- Redis设计
- 监控设计
- 风险分析

禁止：

- 同步执行AI任务
- Worker直接访问HTTP
- Job中保存大量文本内容

未知内容统一标记：

[待确认]
