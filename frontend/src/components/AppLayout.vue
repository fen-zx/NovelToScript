<!-- 桌面端全局布局 -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import NotificationCenter from "./NotificationCenter.vue";
import ThemeToggle from "./ThemeToggle.vue";

const route = useRoute();
const auth = useAuthStore();
const user = computed(() => auth.user);

const navItems = [
  { path: "/", icon: "🏠", label: "首页" },
  { path: "/import", icon: "📥", label: "导入小说" },
  { path: "/tasks", icon: "📋", label: "分析任务" },
  { path: "/schema", icon: "📐", label: "Schema" },
];
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">🎬 NovelToScript</div>
      <nav>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="{ active: route.path === item.path }"
        >
          {{ item.icon }} {{ item.label }}
        </router-link>
      </nav>
    </aside>
    <header class="header">
      <div class="header-right">
        <NotificationCenter />
        <ThemeToggle />
        <span class="user-name">👤 {{ user?.username || "用户" }}</span>
      </div>
    </header>
    <main class="main"><router-view /></main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 180px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.45);
  display: flex;
  flex-direction: column;
}
.dark .sidebar {
  background: rgba(30, 30, 55, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
}
.logo {
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #6c5ce7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
}
.dark .logo {
  color: #a29bfe;
  border-color: rgba(255, 255, 255, 0.08);
}
nav {
  flex: 1;
  padding: 8px 0;
}
nav a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin: 1px 8px;
  color: #303133;
  text-decoration: none;
  font-size: 13px;
  border-radius: 8px;
  transition: 0.2s;
}
.dark nav a {
  color: #e0e0e0;
}
nav a:hover {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  color: #6c5ce7;
}
.dark nav a:hover {
  background: rgba(40, 40, 70, 0.75);
  color: #a29bfe;
}
nav a.active {
  background: #6c5ce7;
  color: #fff !important;
}
.dark nav a.active {
  background: #a29bfe;
}
.header {
  position: fixed;
  top: 0;
  left: 180px;
  right: 0;
  height: 50px;
  z-index: 99;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  gap: 12px;
}
.dark .header {
  background: rgba(30, 30, 55, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  font-size: 13px;
}
.main {
  margin-left: 180px;
  margin-top: 50px;
  padding: 20px;
  flex: 1;
  min-height: calc(100vh - 50px);
}
</style>
