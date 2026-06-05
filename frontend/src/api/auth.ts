// Auth API
import request from './request'
import type { ApiResponse } from '@/types/api'

export interface LoginParams {
  account: string
  password: string
}

export interface RegisterParams {
  username: string
  account: string
  password: string
}

export interface ResetPwdParams {
  username: string
  newPassword: string
}

export interface LoginResult {
  token: string
  user: { id: string; username: string; account: string }
}

export const authApi = {
  register(data: RegisterParams) {
    return request.post<unknown, ApiResponse<{ id: string }>>('/auth/register', data)
  },
  login(data: LoginParams) {
    return request.post<unknown, ApiResponse<LoginResult>>('/auth/login', data)
  },
  resetPassword(data: ResetPwdParams) {
    return request.post<unknown, ApiResponse<null>>('/auth/reset-password', data)
  },
  checkAccount(account: string) {
    return request.get<unknown, ApiResponse<{ available: boolean }>>('/auth/register', {
      params: { check: 'account', value: account },
    })
  },
}
