// Axios 实例 + 拦截器
import axios from 'axios'
import type { ApiResponse } from '@/types/api'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
})

// 请求拦截: JWT 注入
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截: 解包 + 401 跳转
request.interceptors.response.use(
  (res) => res.data as ApiResponse,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default request
