<!-- 移动端全局布局: 底部Tab + 抽屉菜单 -->
<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import ThemeToggle from "./ThemeToggle.vue";

defineSlots<{ default: () => unknown }>();

const route = useRoute();
const drawerVisible = ref(false);

const tabs = [
  { path: "/", icon: "🏠", label: "首页" },
  { path: "/import", icon: "📥", label: "导入" },
  { path: "/tasks", icon: "📋", label: "任务" },
  { path: "/schema", icon: "📐", label: "Schema" },
];
</script>

<template>
  <div class="mobile-layout">
    <header class="mobile-header">
      <button class="hamburger" @click="drawerVisible = !drawerVisible">
        ☰
      </button>
      <span class="mobile-logo">🎬 NovelToScript</span>
      <div class="header-actions">
        <ThemeToggle />
      </div>
    </header>

    <!-- 抽屉菜单 -->
    <div
      class="drawer-overlay"
      v-if="drawerVisible"
      @click="drawerVisible = false"
    />
    <aside class="drawer" :class="{ open: drawerVisible }">
      <nav>
        <router-link
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          :class="{ active: route.path === tab.path }"
          @click="drawerVisible = false"
        >
          {{ tab.icon }} {{ tab.label }}
        </router-link>
      </nav>
    </aside>

    <main class="mobile-main">
      <slot />
    </main>

    <nav class="bottom-tabs">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        :class="{ active: route.path === tab.path }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.mobile-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
}
.hamburger {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
.mobile-logo {
  flex: 1;
  font-weight: 700;
  font-size: 15px;
  text-align: center;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
}
.drawer {
  position: fixed;
  top: 0;
  left: -250px;
  width: 220px;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  z-index: 201;
  transition: left 0.25s;
  padding: 20px 0;
}
.drawer.open {
  left: 0;
}
.drawer nav {
  display: flex;
  flex-direction: column;
}
.drawer a {
  padding: 12px 24px;
  color: #303133;
  text-decoration: none;
  font-size: 14px;
}
.drawer a.active {
  background: #6c5ce7;
  color: #fff;
}
.mobile-main {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}
.bottom-tabs {
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
}
.bottom-tabs a {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  color: #909399;
  text-decoration: none;
  font-size: 10px;
}
.bottom-tabs a.active {
  color: #6c5ce7;
}
.tab-icon {
  font-size: 18px;
}
</style>
