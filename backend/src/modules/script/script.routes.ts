import { Router } from "express"
import { ScriptController } from "./script.controller"
import { UpdateScriptDto, RollbackDto, ExportQuery, PolishScriptDto } from "@/shared/dto/request.dto"
import { validate } from "@/middleware/validate.middleware"
import { authMiddleware } from "@/middleware/auth.middleware"

const router = Router()
const ctrl = new ScriptController()

router.use(authMiddleware)

router.get("/:id", ctrl.getById.bind(ctrl))
router.put("/:id", validate(UpdateScriptDto), ctrl.update.bind(ctrl))
router.get("/:id/versions", ctrl.listVersions.bind(ctrl))
router.get("/:id/versions/:v", ctrl.getVersion.bind(ctrl))
router.post("/:id/rollback", validate(RollbackDto), ctrl.rollback.bind(ctrl))
router.post("/:id/polish", validate(PolishScriptDto), ctrl.polish.bind(ctrl))
router.get("/:id/export", validate(ExportQuery, "query"), ctrl.export.bind(ctrl))

export default router
