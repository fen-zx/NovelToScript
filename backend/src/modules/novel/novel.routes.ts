import { Router } from "express"
import multer from "multer"
import { NovelController } from "./novel.controller"
import { ImportNovelBody } from "@/shared/dto/request.dto"
import { validate } from "@/middleware/validate.middleware"
import { authMiddleware } from "@/middleware/auth.middleware"

const router = Router()
const ctrl = new NovelController()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post("/import", authMiddleware, upload.single("file"), ctrl.importNovel.bind(ctrl))

export default router
