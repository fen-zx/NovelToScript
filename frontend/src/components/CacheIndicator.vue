<!-- 离线缓存状态指示 -->
<script setup lang="ts">
defineProps<{ status?: "active" | "offline" | "syncing" }>();
</script>

<template>
  <span class="cache-indicator" :class="status">
    <template v-if="status === 'active'">🔒 缓存已开启</template>
    <template v-else-if="status === 'offline'">🔓 当前离线</template>
    <template v-else-if="status === 'syncing'">🔄 同步中...</template>
    <template v-else>🔒 已开启</template>
  </span>
</template>

<style scoped>
.cache-indicator {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.cache-indicator.active {
  color: #67c23a;
}
.cache-indicator.offline {
  color: #e6a23c;
}
.cache-indicator.syncing {
  color: #409eff;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
