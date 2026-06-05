<!-- 任务状态彩色标签 -->
<script setup lang="ts">
import type { TaskStatus } from "@/types/api";
import { TASK_STATUS_LABELS } from "@/utils/constants";

defineProps<{ status: TaskStatus }>();
</script>

<template>
  <el-tag
    :type="
      status === 'COMPLETED'
        ? 'success'
        : status === 'PROCESSING'
          ? 'primary'
          : status === 'FAILED'
            ? 'danger'
            : 'warning'
    "
    size="small"
  >
    {{ TASK_STATUS_LABELS[status] }}
  </el-tag>
</template>
