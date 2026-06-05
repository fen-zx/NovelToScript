<!-- 暗色/亮色主题切换 -->
<script setup lang="ts">
import { useThemeStore } from "@/stores/theme";
const theme = useThemeStore();
</script>

<template>
  <button
    class="theme-btn"
    @click="theme.toggle()"
    :title="theme.isDark ? '切换亮色' : '切换暗色'"
  >
    {{ theme.isDark ? "☀️" : "🌙" }}
  </button>
</template>

<style scoped>
.theme-btn {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}
.theme-btn:hover {
  background: rgba(255, 255, 255, 0.72);
}
</style>
