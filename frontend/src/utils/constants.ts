// 全局常量
import type { PolishStyle, TaskStatus } from '@/types/api'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  QUEUED: '排队中',
  PROCESSING: '进行中',
  COMPLETED: '已完成',
  FAILED: '失败',
}

export const POLISH_STYLE_LABELS: Record<PolishStyle, string> = {
  faithful: '原著还原',
  tv_drama: '影视剧风格',
  short_drama: '短剧风格',
  anime: '动漫风格',
  movie: '电影风格',
  tv_series: '电视剧风格',
  stage: '舞台剧风格',
}

export const FILE_ACCEPT = '.txt,.docx,.md'
export const FILE_MAX_SIZE = 20 * 1024 * 1024 // 20MB
export const QUEUE_MAX_RUNNING = 1
export const QUEUE_MAX_QUEUED = 3
