import { prisma } from "@/shared/database/prisma"

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByAccount(account: string) {
    return prisma.user.findUnique({ where: { account } })
  }

  async findByUsername(username: string) {
    return prisma.user.findFirst({ where: { username } })
  }

  async create(data: { username: string; account: string; passwordHash: string }) {
    return prisma.user.create({ data })
  }

  async update(id: string, data: { passwordHash?: string; storageUsed?: number }) {
    return prisma.user.update({ where: { id }, data })
  }
}
