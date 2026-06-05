<!-- 队列状态指示 -->
<script setup lang="ts">
import { QUEUE_MAX_RUNNING, QUEUE_MAX_QUEUED } from "@/utils/constants";

const props = withDefaults(
  defineProps<{
    running?: number;
    queued?: number;
  }>(),
  { running: 0, queued: 0 },
);

const isFull = props.queued >= QUEUE_MAX_QUEUED;
</script>

<template>
  <span class="queue-indicator" :class="{ full: isFull }">
    队列: {{ running }}/{{ QUEUE_MAX_RUNNING }} 排队: {{ queued }}/{{
      QUEUE_MAX_QUEUED
    }}
    <el-tooltip v-if="isFull" content="排队已满，请稍后再试" placement="bottom">
      <span class="full-tip">⚠</span>
    </el-tooltip>
  </span>
</template>

<style scoped>
.queue-indicator {
  font-size: 12px;
  color: #909399;
}
.queue-indicator.full {
  color: #e17055;
}
.full-tip {
  cursor: help;
  margin-left: 4px;
}
</style>
