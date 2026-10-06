FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 迁移 SQL 通过 import.meta.glob(?raw) 编译进产物，migrations/ 不需要带进运行镜像。
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
# .output 是自包含产物（依赖已打包进 bundle），运行时只需要 Node 本身；
# 保留 server/ 与 public/ 的相对布局，静态资源按 server 入口的上一级目录解析。
COPY --from=build /app/.output ./
# SQLite 文件由 db0 的 sqlite 连接器按进程 cwd 解析 `.data/main.sqlite`，
# 因此持久化只需把卷挂到 /app/.data；预建目录让命名卷继承 node 用户的属主。
RUN mkdir -p /app/.data && chown node:node /app/.data
USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
