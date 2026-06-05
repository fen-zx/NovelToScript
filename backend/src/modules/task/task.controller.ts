import type { Response, NextFunction } from "express"
import { TaskService } from "./task.service"
import type { AuthRequest } from "@/middleware/auth.middleware"

const taskService = new TaskService()

export class TaskController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { novelId } = req.body
      const result = await taskService.createTask(req.userId!, novelId)
      res.status(201).json({ code: 0, message: "任务已创建", data: result })
    } catch (err) { next(err) }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await taskService.getTaskList({
        ...req.query,
        userId: req.userId!,
      } as any)
      res.json({
        code: 0, message: "success",
        data: {
          list: result.list, total: result.total,
          page: Number(req.query.page || 1),
          pageSize: Number(req.query.pageSize || 20),
        },
      })
    } catch (err) { next(err) }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await taskService.getTaskById(req.params.id)
      res.json({ code: 0, message: "success", data: result })
    } catch (err) { next(err) }
  }

  async retry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await taskService.retryTask(req.params.id, req.body.mode)
      res.json({ code: 0, message: "重试已入队", data: result })
    } catch (err) { next(err) }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(req.params.id)
      res.json({ code: 0, message: "任务已删除", data: null })
    } catch (err) { next(err) }
  }
}
