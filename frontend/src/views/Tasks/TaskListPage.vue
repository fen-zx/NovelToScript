<!-- P3 分析任务页 -->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { taskApi } from "@/api/tasks";
import type { TaskSummary, TaskStatus } from "@/types/api";

const router = useRouter();
const tasks = ref<TaskSummary[]>([]);
const loading = ref(true);
const error = ref("");
const total = ref(0);
const page = ref(1);
const filters = ref<TaskStatus[]>([]);
const retryVisible = ref(false);
const retryTaskId = ref("");
const retryMode = ref<"resume" | "restart">("resume");

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "排队中", value: "QUEUED" },
  { label: "进行中", value: "PROCESSING" },
  { label: "已完成", value: "COMPLETED" },
  { label: "失败", value: "FAILED" },
];

async function fetchTasks() {
  loading.value = true;
  error.value = "";
  try {
    const res = await taskApi.list({
      page: page.value,
      pageSize: 20,
      status: filters.value.join(",") || undefined,
    });
    tasks.value = res.data.list;
    total.value = res.data.total;
  } catch {
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
}

function toggleFilter(s: TaskStatus) {
  const idx = filters.value.indexOf(s);
  if (idx > -1) filters.value.splice(idx, 1);
  else filters.value.push(s);
  page.value = 1;
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm("确定删除该任务？");
    await taskApi.delete(id);
    ElMessage.success("已删除");
    fetchTasks();
  } catch {
    /* cancelled */
  }
}

function openRetry(id: string) {
  retryTaskId.value = id;
  retryVisible.value = true;
}
async function confirmRetry() {
  await taskApi.retry(retryTaskId.value, retryMode.value);
  ElMessage.success(
    retryMode.value === "resume" ? "断点重试已入队" : "从头重试已入队",
  );
  retryVisible.value = false;
  fetchTasks();
}

onMounted(fetchTasks);
watch(page, fetchTasks);
watch(
  filters,
  () => {
    page.value = 1;
    fetchTasks();
  },
  { deep: true },
);
</script>

<template>
  <div class="task-page">
    <div class="page-header">
      <h2>📋 分析任务</h2>
      <el-button type="primary" @click="router.push('/import')"
        >+ 新建任务</el-button
      >
    </div>

    <div class="filter-bar">
      <el-tag
        v-for="opt in STATUS_OPTIONS"
        :key="opt.value"
        :type="filters.includes(opt.value) ? 'primary' : 'info'"
        class="filter-tag"
        @click="toggleFilter(opt.value)"
      >
        {{ opt.label }}
      </el-tag>
    </div>

    <div v-if="error" class="empty-state">
      <p>{{ error }}</p>
      <el-button @click="fetchTasks">重试</el-button>
    </div>

    <el-table
      v-else
      :data="tasks"
      v-loading="loading"
      stripe
      @row-click="(row: TaskSummary) => router.push(`/tasks/${row.id}`)"
      style="cursor: pointer"
    >
      <el-table-column prop="novelTitle" label="任务名" />
      <el-table-column label="状态" width="90">
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
      <el-table-column label="进度" width="120">
        <template #default="{ row }: { row: TaskSummary }">
          <el-progress
            v-if="row.status === 'PROCESSING'"
            :percentage="Math.round(row.progress * 100)"
          />
          <span v-else>{{
            row.status === "COMPLETED"
              ? "100%"
              : row.status === "FAILED"
                ? Math.round(row.progress * 100) + "%"
                : "—"
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="100">
        <template #default="{ row }: { row: TaskSummary }">{{
          new Date(row.createdAt).toLocaleTimeString()
        }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }: { row: TaskSummary }">
          <el-button
            text
            type="primary"
            size="small"
            @click.stop="router.push(`/tasks/${row.id}`)"
            >查看</el-button
          >
          <el-button
            v-if="row.status === 'FAILED'"
            text
            type="warning"
            size="small"
            @click.stop="openRetry(row.id)"
            >重试</el-button
          >
          <el-button
            v-if="row.status === 'COMPLETED' || row.status === 'FAILED'"
            text
            type="danger"
            size="small"
            @click.stop="handleDelete(row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 20"
      class="mt16"
      v-model:current-page="page"
      :page-size="20"
      :total="total"
      layout="prev, pager, next"
      background
    />

    <!-- Retry Dialog -->
    <el-dialog v-model="retryVisible" title="选择重试模式" width="360px">
      <el-radio-group v-model="retryMode" class="retry-options">
        <el-radio value="resume" size="large"
          >断点重试 (推荐) — 从失败阶段恢复</el-radio
        >
        <el-radio value="restart" size="large"
          >从头开始 — 清空结果重新执行</el-radio
        >
      </el-radio-group>
      <template #footer>
        <el-button @click="confirmRetry()" type="primary">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.task-page {
  width: 100%;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.filter-bar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.filter-tag {
  cursor: pointer;
}
.mt16 {
  margin-top: 16px;
}
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}
.retry-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
