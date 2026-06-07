# 部署与运维指南

> NovelToScript 生产环境部署、监控与运维操作手册

---

## 一、环境要求

| 依赖             | 版本          | 说明        |
| ---------------- | ------------- | ----------- |
| Docker           | ≥ 24.0        | 容器运行时  |
| Docker Compose   | ≥ 2.20        | 服务编排    |
| Node.js          | ≥ 20 (仅前端) | 前端构建    |
| DeepSeek API Key | —             | AI 剧本生成 |

---

## 二、快速部署

### 2.1 配置 DeepSeek API Key

```bash
# 编辑 backend/.env.docker
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 2.2 一键启动

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f backend

# 检查服务健康状态
docker compose ps
```

### 2.3 启动前端

```bash
cd frontend
npm install
npm run dev         # 开发: http://localhost:5173
npm run build       # 生产构建 → dist/
```

---

## 三、服务架构

```
                    ┌──────────────┐
                    │  Browser     │
                    └──────┬───────┘
                           │ :5173 (Vite dev) / :80 (nginx prod)
                    ┌──────▼───────┐
                    │   Frontend   │  Vue 3 + Element Plus
                    └──────┬───────┘
                           │ :3000 (API proxy)
                    ┌──────▼───────┐
                    │   Backend    │  Express + TypeScript
                    │  ┌─────────┐ │
                    │  │ Worker  │ │  BullMQ (需另启进程)
                    │  └─────────┘ │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  Redis  │  │  MinIO  │  │ SQLite  │
        │ :6379   │  │ :9000   │  │ .db     │
        └─────────┘  └─────────┘  └─────────┘
```

---

## 四、启动 Worker 进程

Worker 负责 AI 流水线、润色、PDF 导出、定时清理：

```bash
# 方式一：另开终端（开发）
cd backend
npm run worker

# 方式二：Docker 独立容器
docker compose -f docker-compose.yml up -d backend-worker
```

Worker 列表：

| Worker          | 队列              | 并发 | 超时 | 说明              |
| --------------- | ----------------- | ---- | ---- | ----------------- |
| generate-script | script-generation | 1    | 600s | 7 Agent 流水线    |
| polish-script   | script-polish     | 2    | 120s | AI 润色           |
| export-pdf      | export-pdf        | 2    | 60s  | PDF 导出          |
| cleanup         | cleanup           | 1    | 300s | 定时清理（03:00） |

---

## 五、数据库管理

### 5.1 迁移

```bash
cd backend
npx prisma migrate dev    # 开发环境
npx prisma migrate deploy # 生产环境
```

### 5.2 备份

```bash
# SQLite 单文件备份
cp data/sqlite/dev.db "backup_$(date +%Y%m%d).db"

# MinIO 数据备份
mc mirror local/novels backup/novels/
mc mirror local/scripts backup/scripts/
```

---

## 六、文件生命周期

| 存储桶    | 保留期限 | 清理方式                  |
| --------- | -------- | ------------------------- |
| `novels`  | 30 天    | Cleanup Worker 每日 03:00 |
| `temp`    | 30 天    | Cleanup Worker 每日 03:00 |
| `exports` | 90 天    | Cleanup Worker 每日 03:00 |
| `scripts` | 永久     | 手动删除                  |

---

## 七、监控与健康检查

### 7.1 健康端点

```bash
# API 健康检查
curl http://localhost:3000/api/health
# → { "status": "ok", "timestamp": "..." }

# Redis 连接
docker compose exec redis redis-cli ping
# → PONG

# MinIO 状态
curl http://localhost:9000/minio/health/live
```

### 7.2 日志查看

```bash
docker compose logs -f backend    # API 日志
docker compose logs -f redis      # Redis 日志
docker compose logs -f minio      # MinIO 日志

# Worker 日志（独立进程）
tail -f backend/logs/worker.log
```

---

## 八、常见运维操作

### 8.1 重启服务

```bash
docker compose restart backend    # 仅重启 API
docker compose down && docker compose up -d  # 全部重启
```

### 8.2 清理过期文件（手动）

```bash
# 手动触发清理任务（通过 BullMQ）
cd backend && npx tsx -e "
  const {cleanupQueue} = require('./src/shared/queue/queue-manager');
  cleanupQueue.add('manual-cleanup', {}).then(() => process.exit(0));
"
```

### 8.3 重置数据库

```bash
cd backend
npx prisma migrate reset    # 清空数据 + 重新迁移
```

---

## 九、安全建议

1. **修改默认密码**: `.env.docker` 中 `MINIO_ROOT_PASSWORD`、`JWT_SECRET` 务必修改
2. **API 限流**: 生产环境建议加 nginx `limit_req` 或 API Gateway
3. **HTTPS**: 前端部署使用 nginx + Let's Encrypt 证书
4. **防火墙**: MinIO 9001 控制台端口不对公网开放
5. **环境变量**: `.env.docker` 不提交 Git（已 `.gitignore` 覆盖）

---

## 十、性能调优

| 参数                | 默认值  | 建议                                   |
| ------------------- | ------- | -------------------------------------- |
| Worker concurrency  | 1/2/2/1 | 据 CPU 核数调整                        |
| Redis maxmemory     | 无限制  | 建议 `maxmemory 256mb` + `allkeys-lru` |
| SQLite journal_mode | delete  | 建议改为 `WAL` 模式提升并发读          |
| Task list cache TTL | 10s     | 可在 `task.service.ts` 调整            |
| Cleanup CRON        | 03:00   | 避开业务高峰期                         |
