// Novel 相关类型
import type { FileFormat } from './api'

export interface NovelInfo {
  id: string
  title: string
  author: string | null
  chapterCount: number
  wordCount: number
  fileFormat: FileFormat
  createdAt: string
}

export interface Chapter {
  title: string
  startIndex: number
  endIndex: number
}

export interface FileInfo {
  name: string
  text: string
  format: string
  size: number
}
