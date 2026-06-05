import { Router, type Request, type Response, type NextFunction } from "express"
import { SchemaService } from "./schema.service"

const router = Router()
const schemaService = new SchemaService()

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await schemaService.getSchema()
    res.json({ code: 0, message: "success", data })
  } catch (err) { next(err) }
})

export default router
