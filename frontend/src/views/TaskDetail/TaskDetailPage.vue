<!-- P4 任务详情页 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { taskApi } from "@/api/tasks";
import { connectTaskSSE } from "@/api/tasksSSE";
import type { TaskDetail, AgentState } from "@/types/task";

const route = useRoute();
const router = useRouter();
const task = ref<TaskDetail | null>(null);
const agents = ref<AgentState[]>([
  { name: "NovelAnalysis", status: "PENDING", time: null, progress: 0 },
  { name: "CharacterExtraction", status: "PENDING", time: null, progress: 0 },
  { name: "PlotAnalysis", status: "PENDING", time: null, progress: 0 },
  { name: "ScenePlanning", status: "PENDING", time: null, progress: 0 },
  { name: "ScriptGeneration", status: "PENDING", time: null, progress: 0 },
  { name: "YamlValidation", status: "PENDING", time: null, progress: 0 },
  { name: "FaithfulnessCheck", status: "PENDING", time: null, progress: 0 },
  { name: "ScriptPolish", status: "PENDING", time: null, progress: 0 },
]);

const AGENT_LABELS: Record<string, string> = {
  NovelAnalysis: "小说解析",
  CharacterExtraction: "角色提取",
  PlotAnalysis: "情节分析",
  ScenePlanning: "场景规划",
  ScriptGeneration: "剧本生成",
  YamlValidation: "YAML校验",
  FaithfulnessCheck: "忠实度校验",
  ScriptPolish: "剧本润色",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}
const loading = ref(true);
const error = ref("");
const scriptId = ref<string | null>(null);

const STATUS_ICONS: Record<string, string> = {
  DONE: "✅",
  RUNNING: "🔄",
  PENDING: "⏳",
  FAILED: "❌",
};

function updateAgent(name: string, status: AgentState["status"]) {
  const a = agents.value.find((x) => x.name === name);
  if (a) a.status = status;
}

let closeSSE = () => {};
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchTask() {
  try {
    const res = await taskApi.getById(route.params.id as string);
    task.value = res.data;
    res.data.agentResults?.forEach((r) => {
      const a = agents.value.find((x) => x.name === r.agentName);
      if (a) {
        a.status = r.status;
        a.time = r.completedAt;
      }
    });
    scriptId.value = res.data.scriptId;

    // 任务完成或失败 → 停止轮询
    if (res.data.status === "COMPLETED" || res.data.status === "FAILED") {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (res.data.status === "COMPLETED") ElMessage.success("剧本生成完成!");
    }
  } catch {
    /* ignore polling errors */
  }
}

onMounted(async () => {
  try {
    const res = await taskApi.getById(route.params.id as string);
    task.value = res.data;
    res.data.agentResults?.forEach((r) => {
      const a = agents.value.find((x) => x.name === r.agentName);
      if (a) {
        a.status = r.status;
        a.time = r.completedAt;
      }
    });
    scriptId.value = res.data.scriptId;

    // 任务进行中 → 每 2 秒轮询
    if (res.data.status === "QUEUED" || res.data.status === "PROCESSING") {
      pollTimer = setInterval(fetchTask, 2000);
    }
  } catch {
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }

  closeSSE = connectTaskSSE(route.params.id as string, {
    onAgentStart: (d) => updateAgent(d.agent, "RUNNING"),
    onAgentDone: (d) => updateAgent(d.agent, "DONE"),
    onAgentError: (d) => updateAgent(d.agent, "FAILED"),
    onComplete: (d) => {
      scriptId.value = d.scriptId;
      ElMessage.success("剧本生成完成!");
    },
  });
});

onUnmounted(() => {
  closeSSE();
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<template>
  <div class="detail-page">
    <el-button text type="primary" @click="router.push('/tasks')"
      >← 返回任务列表</el-button
    >

    <div v-if="loading" v-loading="loading" style="min-height: 300px" />
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
    </div>

    <template v-else-if="task">
      <el-card class="mb16">
        <div class="info-header">
          <h2>📊 {{ task.novelTitle }} 分析</h2>
          <el-tag
            :type="
              task.status === 'COMPLETED'
                ? 'success'
                : task.status === 'PROCESSING'
                  ? 'primary'
                  : 'danger'
            "
          >
            {{
              task.status === "QUEUED"
                ? "排队中"
                : task.status === "PROCESSING"
                  ? "进行中"
                  : task.status === "COMPLETED"
                    ? "已完成"
                    : "失败"
            }}
          </el-tag>
        </div>
      </el-card>

      <el-card class="mb16">
        <h3>分析进度</h3>
        <div v-for="a in agents" :key="a.name" class="pipeline-row">
          <span class="agent-icon">{{ STATUS_ICONS[a.status] }}</span>
          <span class="agent-name">{{ AGENT_LABELS[a.name] || a.name }}</span>
          <span
            v-if="a.status === 'RUNNING'"
            class="agent-status agent-running"
          >
            <span class="spin-icon">⏳</span> 进行中
          </span>
          <span v-else class="agent-status">{{
            a.status === "DONE"
              ? "已完成"
              : a.status === "PENDING"
                ? "等待中"
                : "失败"
          }}</span>
          <span class="agent-time">{{ formatTime(a.time) }}</span>
        </div>
      </el-card>

      <el-button
        type="primary"
        size="large"
        :disabled="!scriptId"
        @click="router.push(`/script/${scriptId}`)"
      >
        {{ scriptId ? "进入剧本编辑 →" : "⏳ 分析完成后激活" }}
      </el-button>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  width: 100%;
}
.mb16 {
  margin-bottom: 16px;
}
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pipeline-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}
.agent-icon {
  width: 24px;
  text-align: center;
}
.agent-name {
  flex: 1;
  font-size: 14px;
}
.agent-status {
  flex: 1;
  font-size: 13px;
  color: #909399;
  text-align: center;
}
.agent-time {
  flex: 1;
  font-size: 12px;
  color: #909399;
  text-align: right;
}
.agent-running {
  color: #409eff !important;
}
.spin-icon {
  display: inline-block;
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}
</style>
