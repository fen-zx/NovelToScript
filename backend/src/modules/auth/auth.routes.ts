import { Router } from "express"
import { AuthController } from "./auth.controller"
import { RegisterDto, LoginDto, ResetPasswordDto, CheckAccountQuery } from "@/shared/dto/request.dto"
import { validate } from "@/middleware/validate.middleware"

const router = Router()
const ctrl = new AuthController()

router.post("/register", validate(RegisterDto), ctrl.register.bind(ctrl))
router.post("/login", validate(LoginDto), ctrl.login.bind(ctrl))
router.post("/reset-password", validate(ResetPasswordDto), ctrl.resetPassword.bind(ctrl))
router.get("/register", validate(CheckAccountQuery, "query"), ctrl.checkAccount.bind(ctrl))

export default router
