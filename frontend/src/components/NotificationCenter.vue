<!-- 消息通知中心 -->
<script setup lang="ts">
import { useNotificationStore } from "@/stores/notification";
const store = useNotificationStore();
</script>

<template>
  <div class="notif-wrapper">
    <button class="notif-btn" @click="store.toggle()">
      🔔
      <span v-if="store.messages.length" class="badge">{{
        store.messages.length
      }}</span>
    </button>
    <div v-if="store.visible" class="notif-panel">
      <div class="notif-header">消息通知</div>
      <div v-if="!store.messages.length" class="notif-empty">暂无通知</div>
      <div
        v-for="msg in store.messages"
        :key="msg.id"
        class="notif-item"
        :class="`notif-${msg.type}`"
      >
        <span class="notif-icon">{{
          msg.type === "success" ? "✅" : msg.type === "error" ? "❌" : "ℹ️"
        }}</span>
        <span class="notif-text">{{ msg.message }}</span>
        <span class="notif-time">{{ msg.time }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-wrapper {
  position: relative;
}
.notif-btn {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
}
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e17055;
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  padding: 1px 5px;
  min-width: 16px;
  text-align: center;
}
.notif-panel {
  position: absolute;
  top: 40px;
  right: 0;
  width: 300px;
  max-height: 360px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 200;
  border: 1px solid rgba(255, 255, 255, 0.45);
}
.dark .notif-panel {
  background: rgba(30, 30, 55, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
}
.notif-header {
  padding: 10px 14px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
}
.notif-empty {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.notif-icon {
  flex-shrink: 0;
}
.notif-text {
  flex: 1;
}
.notif-time {
  font-size: 11px;
  color: #909399;
  flex-shrink: 0;
}
</style>
