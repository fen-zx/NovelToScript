# QUEUE_SPECS — BullMQ 队列架构设计

> 基于 SERVICE_SPECS (11 Service) + ARCHITECTURE.md (AI 工作流) 生成
> 队列引擎: BullMQ (Redis-backed) | 日期: 2026-06-05

---

## 一、队列清单

| 队列名              | 用途                   | 触发时机                   | 并发 | 超时 |
| ------------------- | ---------------------- | -------------------------- | ---- | ---- |
| `script-generation` | 8 Agent 流水线生成剧本 | TaskService.createTask     | 1    | 600s |
| `script-polish`     | AI 润色剧本            | PolishService.polishScript | 1    | 120s |
| `export-pdf`        | Puppeteer PDF 渲染导出 | ExportService.exportScript | 2    | 60s  |
| `cleanup`           | 30天过期文件清理       | Cron: 每天 03:00           | 1    | 300s |

---

## 二、Queue 职责

### script-generation

**职责**: 执行完整的 AI 剧本生成流水线

```
创建 Task → 入队 → Worker 执行 8 Agent 步骤
     │
     └── SSE 实时推送每步进度到前端
```

### script-polish

**职责**: 对已有剧本执行 AI 润色

```
POST /api/scripts/:id/polish → 入队 → Worker 调用 LLM 润色 → 写入新 Version
```

### export-pdf

**职责**: Puppeteer 无头浏览器渲染 PDF

```
GET /api/scripts/:id/export?format=pdf → 入队 → Worker 渲染 → 上传 MinIO → 返回文件 URL
```

### cleanup

**职责**: 定期清理过期文件

```
Cron 03:00 → 扫描 MinIO → 删除超过生命周期的文件 → 更新 User.storageUsed
```

---

## 三、Job 设计

### GenerateScriptJob

```ts
interface GenerateScriptJob {
  taskId: string; // Task.id — 关联任务记录
  userId: string; // 数据隔离
  novelId: string; // 小说原文 MinIO 路径: novels/{userId}/{novelId}/original.{ext}
}
```

**Payload 原则**: Job 内不存文本内容，仅存 ID 引用。Worker 通过 ID 从 DB/MinIO 获取数据。

### PolishScriptJob

```ts
interface PolishScriptJob {
  taskId: string; // 关联任务（Polish 也为 Task 创建临时记录）
  scriptId: string; // 剧本 ID
  style:
    | "faithful"
    | "tv_drama"
    | "short_drama"
    | "anime"
    | "movie"
    | "tv_series"
    | "stage";
  targetSection?: string; // 可选：仅润色指定段落
}
```

### ExportPdfJob

```ts
interface ExportPdfJob {
  scriptId: string;
  userId: string;
  format: "pdf";
}
```

### CleanupJob

```ts
interface CleanupJob {
  // 无参数，全量扫描
}
```

**返回**: `{ deletedCount: number, freedBytes: number }`

---

## 四、Worker 设计

### GenerateScriptWorker

```ts
// queue/workers/generate-script.worker.ts

import { Worker } from "bullmq";
import { AgentPipeline } from "@/modules/ai/agent-pipeline";

const worker = new Worker(
  "script-generation",
  async (job) => {
    const { taskId, userId, novelId } = job.data as GenerateScriptJob;

    // 1. 更新 Task 状态 → PROCESSING
    await taskRepo.update(taskId, {
      status: "PROCESSING",
      startedAt: new Date(),
    });

    // 2. 执行 8 Agent 流水线
    const pipeline = new AgentPipeline(taskId, novelId);
    pipeline.on("agent-start", (agent) => {
      // SSE 推送 + 更新 currentAgent
      sseManager.emit(taskId, "agent-start", { agent });
      taskRepo.update(taskId, { currentAgent: agent });
    });
    pipeline.on("agent-progress", (agent, progress) => {
      job.updateProgress(progress); // BullMQ 进度
      sseManager.emit(taskId, "agent-progress", { agent, progress });
    });
    pipeline.on("agent-done", (agent, result) => {
      agentResultRepo.update(taskId, agent, {
        status: "DONE",
        output: JSON.stringify(result),
      });
      sseManager.emit(taskId, "agent-done", { agent });
    });

    try {
      const scriptId = await pipeline.run();
      // 3. 完成
      await taskRepo.update(taskId, {
        status: "COMPLETED",
        progress: 1.0,
        completedAt: new Date(),
      });
      sseManager.emit(taskId, "task-complete", { scriptId });
      return { scriptId };
    } catch (err) {
      // 4. 失败
      await taskRepo.update(taskId, {
        status: "FAILED",
        errorMessage: err.message,
        completedAt: new Date(),
      });
      sseManager.emit(taskId, "task-failed", { error: err.message });
      throw err; // 触发 BullMQ 重试
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 600_000, // 10分钟锁，防止重复执行
  },
);
```

### PolishScriptWorker

```ts
const worker = new Worker(
  "script-polish",
  async (job) => {
    const { scriptId, style, targetSection } = job.data as PolishScriptJob;

    // 1. 获取当前剧本内容
    const script = await scriptRepo.findById(scriptId);
    const currentVersion = await versionRepo.findLatestVersion(scriptId);

    // 2. 调用 LLM 润色
    const prompt = buildPolishPrompt(
      currentVersion.content,
      style,
      targetSection,
    );
    const result = await llmProvider.chat([{ role: "user", content: prompt }]);

    // 3. 写入新 Version
    const newVersion = await versionRepo.create({
      scriptId,
      versionNumber: currentVersion.versionNumber + 1,
      content: result.content,
      note: `AI 润色 - ${style}`,
    });
    await scriptRepo.update(scriptId, {
      currentVersion: newVersion.versionNumber,
    });

    return { versionNumber: newVersion.versionNumber };
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 120_000,
  },
);
```

### ExportPdfWorker

```ts
const worker = new Worker(
  "export-pdf",
  async (job) => {
    const { scriptId, userId } = job.data as ExportPdfJob;

    // 1. 查询剧本数据
    const script = await scriptRepo.findById(scriptId);
    const version = await versionRepo.findLatestVersion(scriptId);
    const characters = await characterRepo.findByScriptId(scriptId);

    // 2. Puppeteer 渲染
    const html = pdfRenderer.buildHtml({ script, version, characters });
    const pdfBuffer = await pdfRenderer.render(html);

    // 3. 上传 MinIO
    const key = `exports/${userId}/${scriptId}/script_v${version.versionNumber}.pdf`;
    const fileUrl = await storageService.upload(
      "exports",
      key,
      pdfBuffer,
      "application/pdf",
    );

    // 4. 返回文件 URL（Controller 再 redirect）
    return {
      fileUrl,
      fileName: `${script.title}_剧本_v${version.versionNumber}.pdf`,
    };
  },
  {
    connection: redisConnection,
    concurrency: 2,
    lockDuration: 60_000,
  },
);
```

### CleanupWorker

```ts
const worker = new Worker(
  "cleanup",
  async () => {
    const now = Date.now();
    let deletedCount = 0;
    let freedBytes = 0;

    // novels/** — 30天
    const novels = await minioClient.listObjects("novels", "", true);
    for (const obj of novels) {
      if (now - obj.lastModified.getTime() > 30 * 86400_000) {
        await minioClient.removeObject("novels", obj.name);
        deletedCount++;
        freedBytes += obj.size;
      }
    }

    // temp/** — 30天
    const temps = await minioClient.listObjects("temp", "", true);
    for (const obj of temps) {
      if (now - obj.lastModified.getTime() > 30 * 86400_000) {
        await minioClient.removeObject("temp", obj.name);
        deletedCount++;
        freedBytes += obj.size;
      }
    }

    // exports/** — 90天
    const exports = await minioClient.listObjects("exports", "", true);
    for (const obj of exports) {
      if (now - obj.lastModified.getTime() > 90 * 86400_000) {
        await minioClient.removeObject("exports", obj.name);
        deletedCount++;
        freedBytes += obj.size;
      }
    }

    return { deletedCount, freedBytes };
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 300_000,
  },
);
```

---

## 五、状态机

### Task 状态流转（对应 DB `Task.status`）

```
         POST /api/tasks
              │
              ▼
          ┌────────┐
          │ QUEUED │  ← 入队 script-generation
          └───┬────┘
              │ Worker 开始执行
              ▼
        ┌───────────┐
        │ PROCESSING│  ← SSE 推送每步进度
        └─────┬─────┘
         ┌────┴────┐
         ▼         ▼
    ┌─────────┐ ┌──────┐
    │COMPLETED│ │FAILED│  ← 可 A10 重试 (resume/restart)
    └─────────┘ └──┬───┘
                   │ POST /api/tasks/:id/retry
                   └──→ QUEUED (断点或从头)
```

### AgentResult 状态流转（对应 DB `AgentResult.status`）

```
PENDING → RUNNING → DONE
                  → FAILED
```

---

## 六、重试策略

| 队列                | 最大重试 | 退避策略 | 延迟计算      |
| ------------------- | -------- | -------- | ------------- |
| `script-generation` | 3 次     | 指数退避 | 2s → 8s → 32s |
| `script-polish`     | 2 次     | 固定间隔 | 5s → 5s       |
| `export-pdf`        | 2 次     | 指数退避 | 1s → 4s       |
| `cleanup`           | 1 次     | —        | 立即          |

```ts
// BullMQ 配置
const scriptGenOpts = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000, // 2s 起始
  },
  removeOnComplete: { age: 3600 * 24 }, // 成功后 24h 清理
  removeOnFail: { age: 3600 * 24 * 7 }, // 失败后 7 天清理
};
```

### 死信队列（DLQ）

当 Job 重试次数耗尽后自动进入 DLQ:

```
script-generation-dlq
export-pdf-dlq
```

DLQ 中的 Job 需要管理员手动检查 + 重放或删除。

---

## 七、超时策略

| 队列                | 超时 | 超时后行为                            |
| ------------------- | ---- | ------------------------------------- |
| `script-generation` | 600s | Job → FAILED, Task 标记失败, SSE 推送 |
| `script-polish`     | 120s | Job → FAILED, 前端提示重试            |
| `export-pdf`        | 60s  | Job → FAILED, 前端提示重试            |
| `cleanup`           | 300s | 记录日志, 下次 Cron 继续              |

```ts
// BullMQ 超时通过 lockDuration 控制
lockDuration: 600_000; // ms
```

---

## 八、优先级策略

| 优先级 | 队列                | 说明                       |
| ------ | ------------------- | -------------------------- |
| 🔴 高  | `script-generation` | 用户主动发起，期望即时反馈 |
| 🟡 中  | `script-polish`     | 用户主动触发，编辑场景     |
| 🟡 中  | `export-pdf`        | 用户主动触发，导出场景     |
| 🟢 低  | `cleanup`           | 系统定时，无用户感知       |

```ts
// 入队时指定优先级 (1=最高)
await queue.add("generate", jobData, { priority: 1 });
await queue.add("polish", jobData, { priority: 2 });
await queue.add("export", jobData, { priority: 2 });
```

---

## 九、并发控制

```
script-generation:  concurrency = 1  (PRD: 最大运行任务数 = 1)
script-polish:      concurrency = 1
export-pdf:         concurrency = 2  (允许2个并行PDF渲染)
cleanup:            concurrency = 1
```

**排队限制**: `script-generation` 队列入队前检查:

```ts
const waitingCount = await queue.getWaitingCount();
if (waitingCount >= 3) {
  throw new AppError(ErrorCode.QUEUE_FULL); // PRD: 最大排队 = 3
}
```

---

## 十、Redis 设计

### BullMQ Key 结构

```
bull:script-generation:{id}        # Job 数据
bull:script-generation:wait        # 等待队列
bull:script-generation:active      # 活跃队列
bull:script-generation:completed   # 完成队列
bull:script-generation:failed      # 失败队列
bull:script-generation:delayed     # 延迟队列

bull:script-polish:...
bull:export-pdf:...
bull:cleanup:...
bull:cleanup:repeat                # Cron 调度状态
```

### SSE 事件频道

```
task:{taskId}:events               # Redis Pub/Sub 频道
```

Worker 每步完成后 publish 事件 → SSE Controller subscribe → 推送到前端。

---

## 十一、Cron 调度

仅 `cleanup` 队列需要定时触发:

```ts
import { QueueScheduler } from "bullmq";

await queue.add(
  "cleanup",
  {},
  {
    repeat: {
      pattern: "0 3 * * *", // 每天 03:00
    },
  },
);
```

---

## 十二、监控设计

### Bull Board (开发/运维面板)

```ts
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// GET /admin/queues — 运维面板
const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullMQAdapter(scriptGenQueue),
    new BullMQAdapter(polishQueue),
    new BullMQAdapter(exportQueue),
    new BullMQAdapter(cleanupQueue),
  ],
  serverAdapter,
});
```

### 监控指标

| 指标         | 来源                               | 告警阈值  |
| ------------ | ---------------------------------- | --------- |
| 活跃 Job 数  | `queue.getActiveCount()`           | > 并发数  |
| 等待 Job 数  | `queue.getWaitingCount()`          | > 3       |
| 失败 Job 数  | `queue.getFailedCount()`           | > 10/小时 |
| 完成 Job 数  | `queue.getCompletedCount()`        | —         |
| 平均耗时     | `job.finishedOn - job.processedOn` | > 600s    |
| 死信队列堆积 | DLQ count                          | > 0       |

---

## 十三、异常处理

### Worker 异常分类

| 异常类型              | 处理                        | 重试                       |
| --------------------- | --------------------------- | -------------------------- |
| DeepSeek API 超时     | 记录日志 → 标记 Task FAILED | ✅ 3次                     |
| DeepSeek 返回格式异常 | YAML Validation 兜底        | ✅ 2次                     |
| MinIO 上传失败        | 记录日志 → 标记 Job FAILED  | ✅ 2次                     |
| Puppeteer 崩溃        | 记录日志 → 重新入队         | ✅ 2次                     |
| 数据库写入失败        | 事务回滚 → 标记 FAILED      | ❌ 不重试（DB 错误需人工） |
| 未知异常              | 记录完整 stack → DLQ        | ✅ 最多3次                 |

### 异常记录

```ts
// AgentResult 记录失败原因
await agentResultRepo.update(taskId, agentName, {
  status: "FAILED",
  errorMessage: err.message,
  completedAt: new Date(),
});
```

---

## 十四、性能分析

| 发现                            | 等级      | 建议                                      |
| ------------------------------- | --------- | ----------------------------------------- |
| script-generation 单次最长 600s | 🟡 Medium | 单并发 + SSE 进度推送, 用户体验可接受     |
| 8 Agent 串行执行可能累计超时    | 🟡 Medium | 当前总耗时 ~255s, 600s 超时足够           |
| 文本分片后每个分片调一次 LLM    | 🟡 Medium | 合并分片结果时内存占用可控 (每片 8000 字) |
| export-pdf 2并发可能内存压力大  | 🟢 Low    | Puppeteer 单实例 ~200MB, 2并发 = 400MB    |

---

## 十五、风险分析

| 编号     | 风险                                     | 等级      | 缓解措施                                        |
| -------- | ---------------------------------------- | --------- | ----------------------------------------------- |
| RISK-001 | DeepSeek API 不可用导致所有生成任务失败  | 🔴 High   | 3次指数退避重试 + DLQ + 前端提示稍后再试        |
| RISK-002 | Redis 宕机导致 BullMQ 全部停摆           | 🔴 High   | Redis 持久化 (AOF) + 哨兵模式 (生产)            |
| RISK-003 | Worker 崩溃中途退出, 任务卡在 PROCESSING | 🟡 Medium | `lockDuration` 超时自动释放 + 定期扫描僵尸任务  |
| RISK-004 | Puppeteer 内存泄漏 (长时间运行)          | 🟡 Medium | 每次 Job 后 `browser.close()` + 单 Job 超时 60s |
| RISK-005 | 死信队列堆积无人处理                     | 🟢 Low    | Bull Board 面板可见 + 定时告警                  |
| RISK-006 | cleanup 误删正在使用的文件               | 🟢 Low    | 按生命周期严格判断 (30d/90d), 非创建时间        |
