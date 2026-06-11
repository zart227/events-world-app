# events-world-app

Fullstack-приложение для мониторинга загрязнения воздуха по городам.

**Возможности:**

- Регистрация и вход с JWT (access + refresh cookie)
- Запрос качества воздуха через серверный прокси к OpenWeatherMap (ключ API только на бэкенде)
- Redis-кэш ответов OWM (30 мин по координатам, 24 ч для геокодинга)
- История запросов с графиками (Ant Design Charts)
- Подписки на города с push-обновлениями (WebSocket + cron раз в час)
- Раздел статей (CRUD) с пагинацией, сортировкой и полнотекстовым поиском (PostgreSQL `tsvector`)
- Роли `user` / `admin`, rate limiting, OpenAPI/Swagger, health-checks, graceful shutdown

**Репозиторий:** https://github.com/zart227/events-world-app

---

## Содержание

1. [Стек технологий](#стек-технологий)
2. [Структура проекта](#структура-проекта)
3. [Архитектура](#архитектура)
4. [Быстрый старт (Docker Compose)](#быстрый-старт-docker-compose)
5. [Локальная разработка](#локальная-разработка)
6. [Переменные окружения](#переменные-окружения)
7. [Документация (docs/)](#документация-docs)
8. [Аутентификация и авторизация](#аутентификация-и-авторизация)
9. [WebSocket](#websocket)
10. [Фронтенд](#фронтенд)
11. [Storybook](#storybook)
12. [Тестирование](#тестирование)
13. [CI/CD](#cicd)
14. [Docker](#docker)
15. [Устранение неполадок](#устранение-неполадок)

---

## Стек технологий

| Слой               | Технологии                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**        | Node.js 22+, TypeScript (ESM), Express 5, PostgreSQL 17, **Prisma ORM 7** (`@prisma/adapter-pg`), Redis, socket.io, node-cron, pino, zod, bcrypt, jsonwebtoken |
| **Frontend**       | React 18, TypeScript, Redux Toolkit (RTK Query), Ant Design, axios, socket.io-client, Create React App                                                         |
| **Тесты**          | vitest + supertest + testcontainers (бэкенд), Cypress (e2e фронта), Storybook                                                                                  |
| **Инфраструктура** | npm workspaces, Docker Compose, GitHub Actions, ESLint + Prettier                                                                                              |

---

## Структура проекта

Монорепозиторий на **npm workspaces**:

```
events-world-app/
├── package.json              # корневой оркестратор workspace'ов
├── docs/                     # документация API и БД
├── docker-compose.yml        # postgres, redis, backend, frontend
├── .env.example              # переменные для docker compose
├── .github/workflows/ci.yml  # CI: lint, typecheck, тесты, сборка фронта
│
├── backend/
│   ├── Dockerfile            # multi-stage (deps → build → runtime)
│   ├── prisma/               # schema.prisma + migrations/
│   ├── prisma.config.ts      # конфиг Prisma CLI (DATABASE_URL, пути)
│   ├── src/
│   │   ├── generated/prisma/ # Prisma Client (генерируется, в .gitignore)
│   │   ├── config/           # env + zod-валидация
│   │   ├── logger/           # pino
│   │   ├── errors/           # AppError и наследники
│   │   ├── middlewares/      # auth, validate, rate-limit, error-handler, request-logger
│   │   ├── dto/              # zod-схемы запросов + типы ответов
│   │   ├── routes/           # Express-роутеры
│   │   ├── controllers/      # тонкие контроллеры
│   │   ├── services/           # бизнес-логика
│   │   ├── repositories/     # data access (Prisma)
│   │   ├── clients/          # OpenWeatherMap API
│   │   ├── jobs/             # cron: обновление подписок
│   │   ├── ws/               # socket.io
│   │   ├── db/               # Prisma client, redis
│   │   ├── docs/             # OpenAPI 3.1
│   │   ├── app.ts            # Express-приложение
│   │   └── server.ts         # точка входа, graceful shutdown
│   └── tests/                # интеграционные + unit-тесты
│
└── frontend/
    ├── Dockerfile            # multi-stage (build → nginx)
    ├── nginx.conf            # SPA + кэш статики
    ├── public/
    ├── src/
    │   ├── components/       # UI-компоненты
    │   ├── pages/            # страницы приложения
    │   ├── services/         # API-клиенты (axios, RTK Query, socket.io)
    │   ├── store/            # Redux store + slices
    │   ├── context/          # AuthContext
    │   ├── router/           # React Router
    │   ├── utils/            # authToken, api interceptors
    │   └── types/
    ├── cypress/              # e2e-тесты
    ├── .storybook/           # конфиг Storybook 8
    └── src/stories/          # stories: компоненты, страницы, routes, Ant Design
```

---

## Архитектура

### Общая схема

```mermaid
flowchart TB
    subgraph Client
        Browser[React SPA]
        WS[socket.io-client]
    end

    subgraph Backend
        API[Express 5 API]
        WSrv[socket.io]
        Cron[node-cron]
        Svc[services]
        Repo[repositories]
    end

    subgraph Data
        Prisma[Prisma ORM]
        PG[(PostgreSQL 17)]
        Redis[(Redis)]
    end

    subgraph External
        OWM[OpenWeatherMap API]
        Yandex[Yandex Geocoder]
    end

    Browser -->|REST /api| API
    WS -->|WebSocket| WSrv
    API --> Svc
    WSrv --> Svc
    Cron --> Svc
    Svc --> Repo
    Svc --> Redis
    Repo --> Prisma
    Prisma --> PG
    Svc --> OWM
    Browser --> Yandex
```

### Слои бэкенда

```
HTTP → routes → middlewares (auth, validate, rate-limit) → controllers → services → repositories → Prisma → PostgreSQL
                                                                ├── clients (OpenWeatherMap)
                                                                ├── cache (Redis)
                                                                ├── jobs (node-cron)
                                                                └── ws (socket.io)
```

**Слой данных (Prisma):**

- **Схема** — `backend/prisma/schema.prisma` (6 моделей: User, UserSettings, RefreshToken, Article, PollutionHistory, CitySubscription).
- **Клиент** — `backend/src/db/prisma.ts`: singleton `PrismaClient` + драйвер `@prisma/adapter-pg`.
- **Репозитории** — тонкие обёртки над Prisma; CRUD через Client API, PostgreSQL-специфика (`tsvector`, `array_agg`) — через `$queryRaw`.
- **Миграции** — Prisma Migrate (`backend/prisma/migrations/`); при старте — `prisma migrate deploy`.

**Принципы:**

- **DTO** — zod-схемы на границе HTTP; типы API не смешиваются с Prisma-моделями (маппинг в repositories).
- **Ошибки** — иерархия `AppError` → `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `TooManyRequestsError`; единый `error-handler` с `requestId`.
- **Логирование** — pino + `pino-http`, каждый запрос получает `x-request-id`.
- **Конфиг** — zod-валидация `.env` при старте; в production запрещён дефолтный `JWT_ACCESS_SECRET`.
- **Транзакции** — `prisma.$transaction`: регистрация (`users` + `user_settings`), ротация refresh-токена.
- **Graceful shutdown** — по `SIGTERM`/`SIGINT`: cron → socket.io → HTTP → Redis → Prisma disconnect (таймаут 10 с).

---

## Быстрый старт (Docker Compose)

```bash
cp .env.example .env
# Обязательно задайте JWT_ACCESS_SECRET и OPENWEATHERMAP_API_KEY
docker compose up --build
```

| Сервис            | URL                                         |
| ----------------- | ------------------------------------------- |
| Frontend          | http://localhost:3000                       |
| API               | http://localhost:3001/api                   |
| Swagger UI        | http://localhost:3001/api/docs              |
| OpenAPI JSON      | http://localhost:3001/api/docs/openapi.json |
| Health (liveness) | http://localhost:3001/health                |
| Readiness         | http://localhost:3001/ready                 |

Миграции Prisma применяются **автоматически** при старте бэкенда (`prisma migrate deploy`).

> **Сброс БД в Docker:** `docker compose down -v` удаляет volume и создаёт чистую схему при следующем старте. Старая таблица `schema_migrations` (legacy SQL-раннер) больше не используется.

Остановка:

```bash
docker compose down      # сохранить данные в volumes
docker compose down -v   # удалить volumes (сброс БД)
```

---

## Локальная разработка

**Требования:** Node.js 22+, Docker (для PostgreSQL и Redis).

```bash
# 1. Зависимости всех workspace'ов
npm install

# 2. Инфраструктура
docker compose up -d postgres redis

# 3. Бэкенд
cp backend/.env.example backend/.env
# При конфликте порта 5432: POSTGRES_PORT=5433 в compose и DATABASE_URL=...@localhost:5433/...
npm run db:generate -w @events-world/backend   # Prisma Client (также в postinstall)
npm run dev              # tsx watch, порт 3001; migrate deploy при старте

# 4. Фронтенд (отдельный терминал)
cp frontend/.env.example frontend/.env
npm run start-client     # CRA dev-server, порт 3000
```

**Корневые npm-скрипты:**

| Команда                                        | Описание                                |
| ---------------------------------------------- | --------------------------------------- |
| `npm run dev`                                  | Бэкенд в watch-режиме                   |
| `npm run start`                                | Бэкенд (production build)               |
| `npm run start-client`                         | Фронтенд dev-server                     |
| `npm run build`                                | Сборка backend + frontend               |
| `npm run migrate`                              | `prisma migrate deploy` (production/CI) |
| `npm run db:migrate -w @events-world/backend`  | Dev: создать и применить миграцию       |
| `npm run db:generate -w @events-world/backend` | Сгенерировать Prisma Client             |
| `npm run db:studio -w @events-world/backend`   | Prisma Studio (GUI для БД)              |
| `npm test`                                     | Тесты бэкенда (vitest + testcontainers) |
| `npm run lint`                                 | ESLint бэкенда                          |
| `npm run typecheck`                            | `tsc --noEmit` бэкенда                  |
| `npm run format`                               | Prettier для backend                    |

---

## Переменные окружения

### Корневой `.env` (для `docker compose`)

| Переменная                 | Обязательно | По умолчанию        | Описание                                              |
| -------------------------- | ----------- | ------------------- | ----------------------------------------------------- |
| `JWT_ACCESS_SECRET`        | да          | —                   | Секрет подписи JWT (мин. 16 символов)                 |
| `OPENWEATHERMAP_API_KEY`   | да\*        | —                   | Ключ OWM (только на сервере)                          |
| `ADMIN_EMAILS`             | нет         | `admin@example.com` | Email'ы с ролью admin при регистрации (через запятую) |
| `REACT_APP_YANDEX_API_KEY` | нет         | —                   | Яндекс-геокодер для страницы «Местоположение»         |
| `FRONTEND_PORT`            | нет         | `3000`              | Порт nginx (фронт)                                    |
| `BACKEND_PORT`             | нет         | `3001`              | Порт API                                              |
| `POSTGRES_PORT`            | нет         | `5432`              | Порт PostgreSQL                                       |
| `REDIS_PORT`               | нет         | `6379`              | Порт Redis                                            |
| `POSTGRES_PASSWORD`        | нет         | `postgres`          | Пароль PostgreSQL                                     |

\* Без ключа OWM эндпоинт `/api/pollutions/current` вернёт ошибку upstream.

### `backend/.env` (локальная разработка)

| Переменная                  | По умолчанию                                                 | Описание                                            |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `NODE_ENV`                  | `development`                                                | `development` \| `test` \| `production`             |
| `SERVER_PORT`               | `3001`                                                       | Порт HTTP-сервера                                   |
| `CLIENT_PORT`               | `3000`                                                       | Порт фронта (для CORS, если `CORS_ORIGIN` не задан) |
| `CORS_ORIGIN`               | `http://localhost:3000`                                      | Origin для CORS                                     |
| `LOG_LEVEL`                 | `info`                                                       | Уровень pino                                        |
| `DATABASE_URL`              | `postgresql://postgres:postgres@localhost:5432/events_world` | PostgreSQL (Prisma + `@prisma/adapter-pg`)          |
| `PG_POOL_SIZE`              | `10`                                                         | Размер пула `pg` внутри Prisma-адаптера             |
| `REDIS_URL`                 | `redis://localhost:6379`                                     | Redis                                               |
| `JWT_ACCESS_SECRET`         | `dev-access-secret-change-me`                                | Секрет JWT                                          |
| `JWT_ACCESS_TTL`            | `15m`                                                        | Время жизни access-токена                           |
| `REFRESH_TOKEN_TTL_DAYS`    | `30`                                                         | Время жизни refresh-токена                          |
| `ADMIN_EMAILS`              | —                                                            | Admin-email'ы                                       |
| `RATE_LIMIT_ENABLED`        | `true`                                                       | Включить rate limiting                              |
| `OPENWEATHERMAP_API_KEY`    | —                                                            | Ключ OWM                                            |
| `OWM_CACHE_TTL_SECONDS`     | `1800`                                                       | TTL кэша загрязнений (30 мин)                       |
| `GEOCODE_CACHE_TTL_SECONDS` | `86400`                                                      | TTL кэша геокодинга (24 ч)                          |
| `CRON_ENABLED`              | `true`                                                       | Включить cron-задачу                                |
| `POLLUTION_REFRESH_CRON`    | `0 * * * *`                                                  | Расписание cron (каждый час)                        |

### `frontend/.env`

| Переменная                 | По умолчанию       | Описание                       |
| -------------------------- | ------------------ | ------------------------------ |
| `REACT_APP_SERVER_URL`     | `http://localhost` | Базовый URL бэкенда            |
| `REACT_APP_SERVER_PORT`    | `3001`             | Порт бэкенда                   |
| `REACT_APP_YANDEX_API_KEY` | —                  | Ключ Яндекс-геокодера          |
| `GENERATE_SOURCEMAP`       | `false`            | Source maps в production build |

---

## Документация (docs/)

Подробная документация вынесена в каталог [`docs/`](docs/README.md):

| Файл                                     | Содержание                                             |
| ---------------------------------------- | ------------------------------------------------------ |
| [docs/api.md](docs/api.md)               | REST API: эндпоинты, примеры, rate limiting, WebSocket |
| [docs/database.md](docs/database.md)     | Prisma ORM: schema, модели, миграции, `$queryRaw`      |
| [docs/components.md](docs/components.md) | Компоненты фронта, Storybook, props, карта страниц     |

### Swagger / OpenAPI

| Ресурс               | URL                                         |
| -------------------- | ------------------------------------------- |
| **Swagger UI**       | http://localhost:3001/api/docs              |
| **OpenAPI 3.1 JSON** | http://localhost:3001/api/docs/openapi.json |

Спецификация описывает все REST-эндпоинты, схемы запросов/ответов и способы аутентификации (Bearer JWT + refresh cookie). Исходник: `backend/src/docs/openapi.ts`.

Импорт в Postman: _Import → Link_ → `http://localhost:3001/api/docs/openapi.json`.

---

## Аутентификация и авторизация

### Схема токенов

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant DB as PostgreSQL

    C->>A: POST /auth/login { email, password }
    A->>DB: verify bcrypt hash
    A-->>C: { accessToken } + Set-Cookie refreshToken

    C->>A: GET /api/pollutions (Authorization: Bearer ...)
    A-->>C: 200 data

    Note over C,A: access истёк (15 мин)
    C->>A: GET /api/... → 401
    C->>A: POST /auth/refresh (cookie)
    A->>DB: rotate refresh (транзакция)
    A-->>C: новый accessToken + новый cookie

    C->>A: POST /auth/logout (cookie)
    A->>DB: revoke refresh
    A-->>C: 204
```

**Детали:**

- **Access-токен** — JWT, 15 мин, в `Authorization: Bearer`, хранится в `localStorage` на фронте.
- **Refresh-токен** — случайные 48 байт (base64url), `httpOnly` cookie `refreshToken`, путь `/api/auth`, 30 дней.
- В БД хранится **sha256-хэш** refresh-токена, не сам токен.
- **Ротация** — при refresh старый токен отзывается, выдаётся новый (в транзакции).
- **Reuse detection** — повторное использование отозванного refresh → отзыв **всех** сессий пользователя.
- **Роли** — `user` (по умолчанию), `admin` (email из `ADMIN_EMAILS` при регистрации).
- **Права admin** — удаление любых статей, очистка истории загрязнений, просмотр всей истории.

---

## WebSocket

**Транспорт:** socket.io (тот же HTTP-сервер, что и API).

**Аутентификация:** access-токен в `handshake.auth.token`.

### События клиент → сервер

| Событие            | Payload                    | Описание                       |
| ------------------ | -------------------------- | ------------------------------ |
| `city:subscribe`   | `string` (название города) | Войти в комнату `city:<город>` |
| `city:unsubscribe` | `string`                   | Покинуть комнату               |

### События сервер → клиент

| Событие            | Payload               | Когда                                      |
| ------------------ | --------------------- | ------------------------------------------ |
| `pollution:update` | `CurrentPollutionDto` | Cron обновил данные по подписанному городу |

**Cron-задача** (`POLLUTION_REFRESH_CRON`, по умолчанию каждый час):

1. Собирает уникальные города из `city_subscriptions`
2. Запрашивает OWM, обновляет Redis-кэш
3. Пишет запись в `pollution_history` каждому подписчику
4. Рассылает `pollution:update` в комнату города

---

## Фронтенд

### Маршруты

| Путь               | Доступ      | Страница          | Описание                                               |
| ------------------ | ----------- | ----------------- | ------------------------------------------------------ |
| `/`                | —           | redirect          | → `/location`                                          |
| `/login`           | гость       | AuthPage          | Вход                                                   |
| `/register`        | гость       | AuthPage          | Регистрация                                            |
| `/location`        | авторизован | LocationInputPage | Ввод координат / адреса (Яндекс-геокодер)              |
| `/city-info`       | авторизован | CityInfoPage      | Запрос по городу, история, график, подписки, WebSocket |
| `/articles`        | публичный   | ArticlesListPage  | Список статей (поиск, сортировка, пагинация)           |
| `/articles/create` | —           | ArticleCreatePage | Создание статьи                                        |
| `/articles/:id`    | публичный   | ArticlePage       | Просмотр статьи                                        |
| `/about`           | публичный   | AboutPage         | О проекте                                              |

### Состояние и API

| Модуль                         | Назначение                                                          |
| ------------------------------ | ------------------------------------------------------------------- |
| `AuthContext`                  | Состояние пользователя, login/register/logout                       |
| `authToken.ts`                 | Access-токен в localStorage, `refreshAccessToken()` с дедупликацией |
| `utils/api.ts`                 | Axios: Bearer header, авто-refresh при 401                          |
| `services/baseQuery.ts`        | RTK Query wrapper с re-auth                                         |
| `services/articlesApi.ts`      | CRUD статей через RTK Query                                         |
| `services/pollutionService.ts` | `/api/pollutions/current` (прокси, не OWM напрямую)                 |
| `services/subscriptionsApi.ts` | REST подписок                                                       |
| `services/socket.ts`           | socket.io-client                                                    |
| `store/pollutionsSlice`        | История загрязнений + `receivePollution` для WebSocket              |
| `services/geocoder.ts`         | RTK Query → Яндекс Geocoder API                                     |

### Поток данных на странице «Город»

1. Пользователь вводит город → `GET /api/pollutions/current?city=...`
2. Ответ сохраняется в историю → `POST /api/pollutions`
3. Подписка → `POST /api/subscriptions`
4. WebSocket подключается, подписывается на комнаты городов
5. Cron обновляет данные → `pollution:update` → Redux без повторного POST

---

## Storybook

**Storybook 8** — изолированная витрина UI: все компоненты приложения, страницы, route guards и базовые примитивы Ant Design. Подробный каталог stories, декораторы и мок-данные: **[docs/components.md](docs/components.md)**.

```bash
npm run storybook -w @events-world/frontend          # dev → http://localhost:6006
npm run build-storybook -w @events-world/frontend    # статическая сборка → frontend/storybook-static
```

| Раздел в Storybook | Содержание                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| `Components/`      | Header, Layout, AuthForm, LocationInputForm, PollutionChart, PollutionTable |
| `Pages/`           | About, Auth, Location, CityInfo, Articles (list / view / create), Error404  |
| `Routes/`          | PrivateRoute, AuthRoute                                                     |
| `Ant/`             | Button, Input (controls и autodocs)                                         |

---

## Тестирование

### Бэкенд

```bash
npm test              # vitest run
npm run test:watch -w @events-world/backend
```

**Интеграционные тесты** (`backend/tests/`):

| Файл                    | Покрытие                                                  |
| ----------------------- | --------------------------------------------------------- |
| `auth.flow.test.ts`     | register, login, refresh-ротация, logout, reuse detection |
| `articles.test.ts`      | CRUD, пагинация, поиск, роли                              |
| `pollutions.test.ts`    | история, прокси /current, кэш                             |
| `subscriptions.test.ts` | подписки CRUD                                             |

**Unit-тесты** (`backend/tests/unit/`): `auth.service`, `token.service`, `article.service`.

**Окружение:** testcontainers поднимает PostgreSQL 17 и Redis 8 один раз в `global-setup.ts`; миграции — `prisma migrate deploy` в `tests/helpers.ts`.

### Фронтенд

```bash
# e2e: production-сборка + статический сервер (рекомендуется)
npm run build -w @events-world/frontend
npm run cypress:run:ci -w @events-world/frontend

# интерактивный режим (нужен запущенный фронт на :3000)
npm run cypress:open -w @events-world/frontend

# против реального API (без моков): бэкенд + фронт + TEST_EMAIL/TEST_PASSWORD
CYPRESS_USE_REAL_API=true npm run cypress:run -w @events-world/frontend
```

Storybook и компоненты — [docs/components.md](docs/components.md).

**Cypress-сценарии (35 тестов):** `about`, `articles`, `auth`, `city-info`, `error404`, `home_page`, `location`, `login`, `logout`, `navigation`, `private-routes`.

По умолчанию API мокируется через `cy.intercept` (не нужны OpenWeatherMap / Yandex / PostgreSQL). Переменные — в `frontend/.env.example`.

### Качество кода

```bash
npm run lint          # ESLint (typescript-eslint, type-checked)
npm run typecheck     # tsc --noEmit
npm run format:check  # Prettier
```

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

**Триггеры:** push в `main`, pull request.

| Job        | Шаги                                                                |
| ---------- | ------------------------------------------------------------------- |
| `backend`  | `npm ci` → lint → typecheck → `db:generate` → test (testcontainers) |
| `frontend` | `npm ci` → build                                                    |

Node.js **22** в CI.

---

## Docker

### Сервисы `docker-compose.yml`

| Сервис     | Образ / build                 | Порт    | Healthcheck      |
| ---------- | ----------------------------- | ------- | ---------------- |
| `postgres` | `postgres:17`                 | 5432    | `pg_isready`     |
| `redis`    | `redis:8`                     | 6379    | `redis-cli ping` |
| `backend`  | `backend/Dockerfile`          | 3001    | `/ready`         |
| `frontend` | `frontend/Dockerfile` → nginx | 3000→80 | —                |

### Сборка образов вручную

```bash
# Контекст — корень репозитория
docker build -f backend/Dockerfile -t events-world-backend .
docker build -f frontend/Dockerfile -t events-world-frontend .
```

Backend Dockerfile: multi-stage (deps → build → prod-deps → runtime), `prisma generate` при сборке, `prisma migrate deploy` при старте контейнера, пользователь `node`, healthcheck на `/ready`.

**Локальная разработка без сборки backend-образа:** `docker compose up -d postgres redis` + `npm run dev` на хосте (рекомендуется при нестабильной сети в Docker build).

Frontend Dockerfile: CRA build → nginx alpine, SPA fallback в `nginx.conf`.

---

## Устранение неполадок

| Проблема                                       | Решение                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `password authentication failed` на порту 5432 | На хосте уже запущен PostgreSQL. Используйте другой порт: `POSTGRES_PORT=5433` в compose или `DATABASE_URL=...@localhost:5433/...`                            |
| `npm ci` падает в Docker с `ETIMEDOUT`         | Медленная сеть в build-контейнере; используйте `docker compose up -d postgres redis` + `npm run dev` на хосте, либо повторите `docker compose build`          |
| `PrismaClient` / generated client not found    | `npm run db:generate -w @events-world/backend` (или `npm install` — срабатывает `postinstall`)                                                                |
| Ошибки после перехода на Prisma в Docker       | `docker compose down -v` — сброс volume со старой схемой / `schema_migrations`                                                                                |
| Admin-роль не назначается                      | Проверьте `ADMIN_EMAILS` в `.env` / `backend/.env`                                                                                                            |
| `/api/pollutions/current` → 502/500            | Задайте `OPENWEATHERMAP_API_KEY`                                                                                                                              |
| Rate limiter `ClientClosedError` при старте    | Redis ещё не подключён — лимитер ждёт соединения лениво (исправлено в `rate-limit.ts`)                                                                        |
| CORS-ошибки                                    | `CORS_ORIGIN` должен совпадать с URL фронта (`http://localhost:3000`)                                                                                         |
| Миграции не применились                        | `npm run migrate` или перезапуск бэкенда (`prisma migrate deploy` в `server.ts`)                                                                              |
| Storybook падает с `reading 'extends'`         | В `frontend/.storybook/main.ts` у `@storybook/preset-create-react-app` задайте `options: { babelOptions: {} }` (см. [docs/components.md](docs/components.md)) |

---

## История рефакторинга

Проект переведён с монолитного CommonJS + MongoDB + in-memory users на современный стек:

| Этап | Коммит    | Содержание                                                                               |
| ---- | --------- | ---------------------------------------------------------------------------------------- |
| 1    | `541b686` | TypeScript ESM, слоистая архитектура, zod, pino, error-handler                           |
| 2    | `4bfdab9` | PostgreSQL, ручные SQL-миграции, репозитории на `pg`                                     |
| 3    | `4696468` | bcrypt, JWT access/refresh, роли, rate limiting                                          |
| 4    | `dfdbd9c` | OWM-прокси, Redis-кэш, подписки, cron, WebSocket, поиск статей, Swagger                  |
| 5    | `434a58f` | vitest + supertest + testcontainers, unit-тесты                                          |
| 6    | `62c9bdc` | npm workspaces, Docker Compose, CI, ESLint/Prettier, README                              |
| 7    | —         | **Prisma ORM 7**: schema, Prisma Migrate, `@prisma/adapter-pg`, `$queryRaw` для tsvector |
