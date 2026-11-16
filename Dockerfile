# Phase 2/3 容器化入口（方便随时迁往任意云 / Kamal 2 / Dokploy / Coolify）
FROM node:24-alpine AS frontend
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN pnpm build

FROM python:3.12-slim
WORKDIR /app
COPY server ./server
COPY --from=frontend /app/dist ./dist
ENV HOST=0.0.0.0 PORT=3301
EXPOSE 3301
CMD ["python3", "server/app.py"]
