import { Router } from "express"
import { TaskController } from "./task.controller"
import { CreateTaskDto, TaskListQuery, RetryTaskDto } from "@/shared/dto/request.dto"
import { validate } from "@/middleware/validate.middleware"
import { authMiddleware } from "@/middleware/auth.middleware"

const router = Router()
const ctrl = new TaskController()

router.use(authMiddleware)

router.post("/", validate(CreateTaskDto), ctrl.create.bind(ctrl))
router.get("/", validate(TaskListQuery, "query"), ctrl.list.bind(ctrl))
router.get("/:id", ctrl.getById.bind(ctrl))
router.post("/:id/retry", validate(RetryTaskDto), ctrl.retry.bind(ctrl))
router.delete("/:id", ctrl.delete.bind(ctrl))

export default router
