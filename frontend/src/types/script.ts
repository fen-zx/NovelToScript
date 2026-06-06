// Script 相关类型
import type { CharacterRole } from './api'

export interface ScriptDetail {
  id: string
  title: string
  currentVersion: number
  content: string
  characters: ScriptCharacter[]
  novelTitle: string
  novelAuthor: string | null
  createdAt: string
  updatedAt: string
}

export interface ScriptCharacter {
  id: string
  name: string
  role: CharacterRole
  description: string | null
  traits: string[] | null
}

export interface VersionSummary {
  versionNumber: number
  note: string | null
  createdAt: string
}

export interface VersionDetail {
  versionNumber: number
  content: string
  note: string | null
  createdAt: string
}

export interface ValidationError {
  line: number
  field: string
  message: string
}
