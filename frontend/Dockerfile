# Контекст сборки — корень репозитория (npm workspaces)
# docker build -f frontend/Dockerfile .

FROM node:22-bookworm-slim AS build
WORKDIR /app
# Устойчивость к медленной сети при скачивании пакетов
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
# Кэш-маунт npm + повторные попытки: при обрыве сети уже скачанные пакеты переиспользуются
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @events-world/frontend \
    || npm ci --workspace @events-world/frontend \
    || npm ci --workspace @events-world/frontend

COPY frontend frontend

ARG REACT_APP_SERVER_URL=http://localhost
ARG REACT_APP_SERVER_PORT=3001
ARG REACT_APP_YANDEX_API_KEY=
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL \
    REACT_APP_SERVER_PORT=$REACT_APP_SERVER_PORT \
    REACT_APP_YANDEX_API_KEY=$REACT_APP_YANDEX_API_KEY \
    GENERATE_SOURCEMAP=false
RUN npm run build -w @events-world/frontend

FROM nginx:1.29-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/build /usr/share/nginx/html
EXPOSE 80
