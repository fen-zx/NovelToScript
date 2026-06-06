// Auth Store — Pinia
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<{ id: string; username: string; account: string } | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function setUser(u: { id: string; username: string; account: string }) {
    user.value = u
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    // 路由跳转由调用方处理（避免 store 内 useRouter 不可用）
  }

  return { token, user, isLoggedIn, setToken, setUser, logout }
})
