// Notification Store — Pinia
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  time: string
}

export const useNotificationStore = defineStore('notification', () => {
  const messages = ref<NotificationItem[]>([])
  const visible = ref(false)

  function push(item: Omit<NotificationItem, 'id' | 'time'>) {
    messages.value.unshift({
      ...item,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
    })
    if (messages.value.length > 20) messages.value.pop()
  }

  function shift() {
    return messages.value.shift()
  }

  function toggle() {
    visible.value = !visible.value
  }

  return { messages, visible, push, shift, toggle }
})
