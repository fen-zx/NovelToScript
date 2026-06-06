// Script API
import request from './request'
import type { ApiResponse, PolishStyle, ExportFormat } from '../types/api'
import type { ScriptDetail, VersionSummary, VersionDetail } from '@/types/script'

export const scriptApi = {
  getById(id: string) {
    return request.get<unknown, ApiResponse<ScriptDetail>>(`/scripts/${id}`)
  },
  update(id: string, data: { content: string; note?: string }) {
    return request.put<unknown, ApiResponse<{ id: string; currentVersion: number; updatedAt: string }>>(
      `/scripts/${id}`,
      data
    )
  },
  polish(id: string, data: { style: PolishStyle; targetSection?: string }) {
    return request.post<unknown, ApiResponse<{ taskId: string; status: string }>>(`/scripts/${id}/polish`, data)
  },
  getVersions(id: string) {
    return request.get<unknown, ApiResponse<VersionSummary[]>>(`/scripts/${id}/versions`)
  },
  getVersion(id: string, v: number) {
    return request.get<unknown, ApiResponse<VersionDetail>>(`/scripts/${id}/versions/${v}`)
  },
  rollback(id: string, version: number) {
    return request.post<unknown, ApiResponse<{ id: string; currentVersion: number }>>(`/scripts/${id}/rollback`, {
      version,
    })
  },
  export(id: string, format: ExportFormat) {
    return request.get(`/scripts/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })
  },
}
