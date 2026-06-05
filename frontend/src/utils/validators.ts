// 通用校验工具
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidAccount(account: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(account)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

export function isValidUsername(username: string): boolean {
  return username.length >= 2 && username.length <= 20
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
