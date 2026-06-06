// Axios 实例 + 拦截器
import axios from 'axios'

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
  (res): any => res.data,
  (err) => {
    if (err.response?.status === 401) {
      // 非登录接口的 401 才跳转（登录失败 401 由页面自行处理）
      const isLoginRequest = err.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        window.location.href = '/auth'
      }
    }
    return Promise.reject(err)
  }
)

export default request
