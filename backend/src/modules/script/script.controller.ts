import type { Response, NextFunction } from "express"
import { ScriptService } from "./script.service"
import { VersionRepository } from "./version.repository"
import type { AuthRequest } from "@/middleware/auth.middleware"

const scriptService = new ScriptService()
const versionRepo = new VersionRepository()

export class ScriptController {
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.getScriptById(req.params.id)
      res.json({ code: 0, message: "success", data: result })
    } catch (err) { next(err) }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.updateScript(req.params.id, req.body.content, req.body.note)
      res.json({ code: 0, message: "保存成功", data: result })
    } catch (err) { next(err) }
  }

  async listVersions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const versions = await versionRepo.findByScriptId(req.params.id)
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
      const v = await versionRepo.findByScriptIdAndNumber(req.params.id, Number(req.params.v))
      res.json({ code: 0, message: "success", data: v })
    } catch (err) { next(err) }
  }

  async rollback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scriptService.rollbackScript(req.params.id, req.body.version)
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
