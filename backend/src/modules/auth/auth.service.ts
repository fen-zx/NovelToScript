import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { UserRepository } from "./user.repository"
import { Errors } from "@/shared/errors/error-codes"
import { env } from "@/config/env"

export class AuthService {
  constructor(private userRepo = new UserRepository()) {}

  async register(username: string, account: string, password: string) {
    const exists = await this.userRepo.findByAccount(account)
    if (exists) throw Errors.accountExists()

    const passwordHash = await bcrypt.hash(password, 12)
    return this.userRepo.create({ username, account, passwordHash })
  }

  async login(account: string, password: string) {
    const user = await this.userRepo.findByAccount(account)
    if (!user) throw Errors.invalidCredentials()

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw Errors.invalidCredentials()

    const token = jwt.sign(
      { userId: user.id, role: "author" },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    return { token, user: { id: user.id, username: user.username, account: user.account } }
  }

  async resetPassword(username: string, newPassword: string) {
    const user = await this.userRepo.findByUsername(username)
    if (!user) throw Errors.usernameNotFound()

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.userRepo.update(user.id, { passwordHash })
  }

  async checkAccount(account: string): Promise<boolean> {
    const user = await this.userRepo.findByAccount(account)
    return !user
  }
}
