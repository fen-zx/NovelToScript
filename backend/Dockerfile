# ===== Build Stage =====
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY src/ ./src/
COPY prisma/ ./prisma/

# 生成 Prisma Client（需要 devDependencies 中的 typescript）
RUN npx prisma generate

# ===== Production Stage =====
FROM node:22-alpine AS runner

WORKDIR /app

# 安装生产依赖（含 tsx + prisma）
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 复制源码 + Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src

# 数据持久化目录
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/main.ts"]
