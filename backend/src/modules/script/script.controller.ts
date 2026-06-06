import type { Response, NextFunction } from "express"
import { ScriptService } from "./script.service"
import { PolishService } from "./polish.service"
import { VersionRepository } from "./version.repository"
import type { AuthRequest } from "@/middleware/auth.middleware"

const scriptService = new ScriptService()
const polishService = new PolishService()
const versionRepo = new VersionRepository()

export class ScriptController {

  async polish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { style, targetSection } = req.body
      const result = await polishService.polishScript(req.params.id as string, style, targetSection)
      res.json({ code: 0, message: "润色任务已入队", data: result })
    } catch (err) { next(err) }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.getScriptById(req.params.id as string)
      res.json({ code: 0, message: "success", data: result })
    } catch (err) { next(err) }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.updateScript(req.params.id as string, req.body.content, req.body.note)
      res.json({ code: 0, message: "保存成功", data: result })
    } catch (err) { next(err) }
  }

  async listVersions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const versions = await versionRepo.findByScriptId(req.params.id as string)
      res.json({
        code: 0, message: "success",
        data: versions.map(v => ({
          versionNumber: v.versionNumber, note: v.note,
          createdAt: v.createdAt.toISOString(),
        })),
      })
    } catch (err) { next(err) }
  }

  async getVersion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const v = await versionRepo.findByScriptIdAndNumber(req.params.id as string, Number(req.params.v))
      res.json({ code: 0, message: "success", data: v })
    } catch (err) { next(err) }
  }

  async rollback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.rollbackScript(req.params.id as string, req.body.version)
      res.json({ code: 0, message: "回滚成功", data: result })
    } catch (err) { next(err) }
  }

  async export(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // [TODO] 实现导出逻辑
      res.json({ code: 0, message: "success", data: null })
    } catch (err) { next(err) }
  }
}
