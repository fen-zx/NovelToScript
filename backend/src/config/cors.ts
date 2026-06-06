// CORS 配置
import cors from "cors"

export const corsConfig = cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://your-domain.com"]     // [TODO] 替换为实际域名
    : ["http://localhost:5173"],       // Vite 默认端口
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})
