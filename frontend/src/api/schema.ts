// Schema API
import request from './request'
import type { ApiResponse } from '@/types/api'

export interface SchemaData {
  version: string
  schema: Record<string, unknown>
  designRationale: string
  example: string
  updatedAt: string
}

export const schemaApi = {
  get() {
    return request.get<unknown, ApiResponse<SchemaData>>('/schema')
  },
}
