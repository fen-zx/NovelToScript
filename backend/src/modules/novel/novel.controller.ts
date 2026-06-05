import type { Response, NextFunction } from "express"
import { NovelService } from "./novel.service"
import type { AuthRequest } from "@/middleware/auth.middleware"

const novelService = new NovelService()

export class NovelController {
  async importNovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, author } = req.body
      const result = await novelService.importNovel(req.userId!, req.file, title, author)
      res.status(201).json({ code: 0, message: "导入成功", data: result })
    } catch (err) { next(err) }
  }
}
