<!-- P1 项目首页 -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { taskApi } from "@/api/tasks";
import type { TaskSummary } from "@/types/task";

const router = useRouter();
const tasks = ref<TaskSummary[]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const res = await taskApi.list({ pageSize: 5 });
    tasks.value = res.data.list;
  } catch {
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="home-page">
    <el-card class="mb16" shadow="hover">
      <h3>📊 项目概览</h3>
      <p>NovelToScript — AI辅助剧本创作</p>
      <p class="desc">
        将您的小说快速转换为结构化剧本初稿，支持 3~100 章长文本处理。
      </p>
    </el-card>

    <el-card class="mb16" shadow="hover">
      <h3>🚀 快速操作</h3>
      <div class="quick-actions">
        <el-button type="primary" @click="router.push('/import')"
          >📥 导入小说</el-button
        >
        <el-button @click="router.push('/tasks')">📋 查看任务</el-button>
      </div>
    </el-card>

    <el-card shadow="hover">
      <div class="section-header">
        <h3>📌 最近任务</h3>
        <el-button text type="primary" @click="router.push('/tasks')"
          >查看全部 →</el-button
        >
      </div>

      <div v-if="loading" v-loading="loading" style="min-height: 120px" />

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <el-button text type="primary" @click="onMounted">重试</el-button>
      </div>

      <div v-else-if="!tasks.length" class="empty-state">
        <p>
          📭 暂无任务，<el-button
            text
            type="primary"
            @click="router.push('/import')"
            >去导入小说 →</el-button
          >
        </p>
      </div>

      <el-table
        v-else
        :data="tasks"
        stripe
        table-layout="fixed"
        @row-click="(row: TaskSummary) => router.push(`/tasks/${row.id}`)"
        style="cursor: pointer"
      >
        <el-table-column prop="novelTitle" label="任务名" align="center" />
        <el-table-column label="状态" align="center">
          <template #default="{ row }: { row: TaskSummary }">
            <el-tag
              :type="
                row.status === 'COMPLETED'
                  ? 'success'
                  : row.status === 'PROCESSING'
                    ? 'primary'
                    : row.status === 'FAILED'
                      ? 'danger'
                      : 'warning'
              "
              size="small"
            >
              {{
                row.status === "QUEUED"
                  ? "排队中"
                  : row.status === "PROCESSING"
                    ? "进行中"
                    : row.status === "COMPLETED"
                      ? "已完成"
                      : "失败"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" align="center">
          <template #default="{ row }: { row: TaskSummary }">
            <el-progress
              v-if="row.status === 'PROCESSING'"
              :percentage="Math.round(row.progress * 100)"
            />
            <span v-else>{{
              row.status === "COMPLETED"
                ? "100%"
                : row.status === "FAILED"
                  ? `${Math.round(row.progress * 100)}%`
                  : "—"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" align="center">
          <template #default="{ row }: { row: TaskSummary }">{{
            new Date(row.createdAt).toLocaleTimeString()
          }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="{ row }: { row: TaskSummary }"
            ><el-button text type="primary" size="small"
              >查看 →</el-button
            ></template
          >
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}
.mb16 {
  margin-bottom: 16px;
}
h3 {
  margin-bottom: 8px;
}
.desc {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
.quick-actions {
  display: flex;
  gap: 8px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
</style>
