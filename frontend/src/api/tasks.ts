// Task API
import request from './request'
import type { ApiResponse, PaginatedData, RetryMode } from '@/types/api'
import type { TaskSummary, TaskDetail } from '@/types/task'

export interface TaskListParams {
  page?: number
  pageSize?: number
  status?: string
  sortBy?: string
  sortOrder?: string
}

export const taskApi = {
  create(novelId: string) {
    return request.post<unknown, ApiResponse<{ id: string; status: string }>>('/tasks', { novelId })
  },
  list(params: TaskListParams) {
    return request.get<unknown, ApiResponse<PaginatedData<TaskSummary>>>('/tasks', { params })
  },
  getById(id: string) {
    return request.get<unknown, ApiResponse<TaskDetail>>(`/tasks/${id}`)
  },
  retry(id: string, mode: RetryMode) {
    return request.post<unknown, ApiResponse<{ id: string; status: string }>>(`/tasks/${id}/retry`, { mode })
  },
  delete(id: string) {
    return request.delete<unknown, ApiResponse<null>>(`/tasks/${id}`)
  },
}
