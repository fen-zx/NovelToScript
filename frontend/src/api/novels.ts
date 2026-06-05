// Novel API
import request from './request'
import type { ApiResponse } from '@/types/api'
import type { NovelInfo } from '@/types/novel'

export const novelApi = {
  import(formData: FormData) {
    return request.post<unknown, ApiResponse<NovelInfo>>('/novels/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
}
