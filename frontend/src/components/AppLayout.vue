<!-- 桌面端全局布局 -->
<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import ThemeToggle from "./ThemeToggle.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const showUserMenu = ref(false);

function handleLogout(e: Event) {
  e.stopPropagation();
  auth.logout();
  router.push("/auth");
}

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
        <ThemeToggle />
        <div
          class="user-area"
          @mouseenter="showUserMenu = true"
          @mouseleave="showUserMenu = false"
          @click="showUserMenu = !showUserMenu"
        >
          <span class="user-name">👤</span>
          <Transition name="fade">
            <div v-if="showUserMenu" class="user-dropdown" @click.stop>
              <button class="logout-btn" @click="handleLogout">退出登录</button>
            </div>
          </Transition>
        </div>
      </div>
    </header>
    <main class="main"><router-view /></main>
  </div>
</template>

<style scoped>
.app-layout {
  --sidebar-w: clamp(60px, 15vw, 280px);
  --header-h: clamp(56px, 10vh, 96px);
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
  color: #303133;
  transition:
    background 0.3s,
    color 0.3s;
}
.dark .app-layout {
  background: #1a1a2e;
  color: #e0e0e0;
}
.sidebar {
  width: var(--sidebar-w);
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
  height: var(--header-h);
  display: flex;
  align-items: center;
  padding: 0 clamp(16px, 1.5vw, 20px);
  font-size: clamp(18px, 1.5vw, 22px);
  font-weight: 700;
  color: #6c5ce7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
}
.dark .logo {
  color: #a29bfe;
  border-color: rgba(255, 255, 255, 0.08);
}
nav {
  flex: 1;
  padding: clamp(8px, 1vh, 12px) 0;
}
nav a {
  display: flex;
  align-items: center;
  gap: clamp(8px, 0.8vw, 12px);
  padding: clamp(12px, 1.2vh, 14px) clamp(16px, 1.5vw, 20px);
  margin: 2px clamp(8px, 0.5vw, 12px);
  color: #303133;
  text-decoration: none;
  font-size: clamp(14px, 1.1vw, 17px);
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
  left: var(--sidebar-w);
  right: 0;
  height: var(--header-h);
  z-index: 99;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 clamp(16px, 1.5vw, 24px);
  padding-right: calc(clamp(16px, 1.5vw, 24px) + 5vw);
  gap: clamp(12px, 1.2vw, 20px);
}
.dark .header {
  background: rgba(30, 30, 55, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
}
.header-right {
  display: flex;
  align-items: center;
  gap: clamp(12px, 1.2vw, 20px);
}
.user-area {
  position: relative;
  cursor: pointer;
  padding-bottom: 8px;
}
.user-name {
  font-size: clamp(14px, 1vw, 16px);
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-name:hover {
  background: rgba(108, 92, 231, 0.1);
}
.user-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding-top: 6px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 6px;
  z-index: 300;
  min-width: 110px;
}
.dark .user-dropdown {
  background: rgba(40, 40, 70, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
}
.logout-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 8px 14px;
  font-size: 13px;
  color: #e17055;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: background 0.15s;
}
.logout-btn:hover {
  background: rgba(225, 112, 85, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.main {
  margin-left: var(--sidebar-w);
  margin-top: var(--header-h);
  padding: clamp(16px, 2vh, 24px);
  flex: 1;
  width: calc(100vw - var(--sidebar-w));
  height: calc(100vh - var(--header-h));
  overflow-y: auto;
  font-size: clamp(20px, 1.3vw, 22px);
  box-sizing: border-box;
  background: #f5f7fa;
  color: #303133;
  transition:
    background 0.3s,
    color 0.3s;
}
.dark .main {
  background: #1a1a2e;
  color: #e0e0e0;
}
</style>
