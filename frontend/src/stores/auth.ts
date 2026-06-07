// Auth Store — Pinia
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo { id: string; username: string; account: string }

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(loadUser())

  const isLoggedIn = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function setUser(u: UserInfo) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 路由跳转由调用方处理（避免 store 内 useRouter 不可用）
  }

  return { token, user, isLoggedIn, setToken, setUser, logout }
})
