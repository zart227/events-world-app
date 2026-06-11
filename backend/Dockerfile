# Контекст сборки — корень репозитория (npm workspaces)
# docker build -f backend/Dockerfile .

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Устойчивость к медленной сети при скачивании пакетов
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000
COPY package.json package-lock.json ./
COPY backend/package.json backend/
# Кэш-маунт npm + повторные попытки: при обрыве сети уже скачанные пакеты переиспользуются
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @events-world/backend \
    || npm ci --workspace @events-world/backend \
    || npm ci --workspace @events-world/backend

FROM deps AS build
COPY backend/tsconfig.json backend/tsconfig.build.json backend/prisma.config.ts backend/
COPY backend/prisma backend/prisma
COPY backend/src backend/src
RUN npm run build -w @events-world/backend

FROM deps AS prod-deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @events-world/backend --omit=dev \
    || npm ci --workspace @events-world/backend --omit=dev \
    || npm ci --workspace @events-world/backend --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY backend/package.json backend/
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/src/generated backend/src/generated

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.SERVER_PORT||3001)+'/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/server.js"]
