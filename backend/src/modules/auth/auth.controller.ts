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
      const { username, newPassword } = req.body
      await authService.resetPassword(username, newPassword)
      res.json({ code: 0, message: "密码重置成功", data: null })
    } catch (err) { next(err) }
  }

  async checkAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const available = await authService.checkAccount(req.query.value as string)
      res.json({ code: 0, message: "success", data: { available } })
    } catch (err) { next(err) }
  }
}
