import type { Request, Response, NextFunction } from "express"
import { AuthService } from "./auth.service"
import type { AuthRequest } from "@/middleware/auth.middleware"

const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, account, password } = req.body
      const user = await authService.register(username, account, password)
      res.status(201).json({ code: 0, message: "注册成功", data: user })
    } catch (err) { next(err) }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { account, password } = req.body
      const result = await authService.login(account, password)
      res.json({ code: 0, message: "登录成功", data: result })
    } catch (err) { next(err) }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, account, newPassword } = req.body
      if (!newPassword) {
        // Step 1: 验证用户名+账号是否匹配
        await authService.verifyUsernameAndAccount(username, account)
        res.json({ code: 0, message: "身份验证通过", data: null })
      } else {
        // Step 2: 执行密码重置
        if (newPassword.length < 6) {
          res.status(400).json({ code: 400, message: "密码至少6位", data: null })
          return
        }
        await authService.resetPassword(username, account, newPassword)
        res.json({ code: 0, message: "密码重置成功", data: null })
      }
    } catch (err) { next(err) }
  }

  async checkAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const available = await authService.checkAccount(req.query.value as string)
      res.json({ code: 0, message: "success", data: { available } })
    } catch (err) { next(err) }
  }
}
