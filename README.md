# events-world-app

Fullstack-приложение для мониторинга загрязнения воздуха по городам: регистрация и вход (JWT), запрос качества воздуха через серверный прокси к OpenWeatherMap с Redis-кэшем, история запросов, графики, подписки на города с push-обновлениями (WebSocket + cron), раздел статей с полнотекстовым поиском.

## Стек

| Слой | Технологии |
|---|---|
| Backend | Node.js 22+, TypeScript (ESM), Express 5, PostgreSQL (`pg`, чистый SQL), Redis, socket.io, node-cron, pino, zod |
| Frontend | React 18, TypeScript, Redux Toolkit (RTK Query), Ant Design, socket.io-client |
| Тесты | vitest + supertest + testcontainers (бэкенд), Cypress (e2e фронта) |
| Инфраструктура | npm workspaces, Docker Compose, GitHub Actions, ESLint + Prettier |

## Быстрый старт (одной командой)

```bash
cp .env.example .env   # заполните JWT_ACCESS_SECRET и OPENWEATHERMAP_API_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger UI: http://localhost:3001/api/docs
- Health: http://localhost:3001/health, readiness: http://localhost:3001/ready

Миграции применяются автоматически при старте бэкенда.

## Локальная разработка

```bash
npm install                 # ставит зависимости всех workspace'ов

# инфраструктура (PostgreSQL + Redis)
docker compose up -d postgres redis

# бэкенд (tsx watch, порт 3001)
cp backend/.env.example backend/.env
npm run dev

# фронтенд (CRA dev-server, порт 3000)
npm run start-client
```

## Архитектура бэкенда

Слоистая архитектура с DTO между слоями:

```
HTTP → routes → middlewares (auth, validate, rate-limit) → controllers → services → repositories → PostgreSQL
                                                                ├── clients (OpenWeatherMap)
                                                                ├── cache (Redis)
                                                                ├── jobs (node-cron)
                                                                └── ws (socket.io)
```

```
backend/
├── migrations/          # SQL-миграции (применяются раннером по порядку)
├── src/
│   ├── config/          # env-конфиг с валидацией схемы (zod) при старте
│   ├── logger/          # pino
│   ├── errors/          # AppError → NotFoundError, ConflictError, UnauthorizedError...
│   ├── middlewares/     # requireAuth, requireRole, validate(zod), error-handler,
│   │                    # request-id + pino-http, rate-limit (Redis store)
│   ├── dto/             # zod-схемы запросов + типы ответов
│   ├── routes/          # маршруты (auth, articles, pollutions, subscriptions, health)
│   ├── controllers/     # тонкие контроллеры
│   ├── services/        # бизнес-логика (auth, token, article, pollution, subscription, cache)
│   ├── repositories/    # SQL-запросы (pg, без ORM)
│   ├── clients/         # OpenWeatherMap (geocoding + air pollution)
│   ├── jobs/            # cron: ежечасное обновление городов из подписок
│   ├── ws/              # socket.io: комнаты city:<город>, push при обновлении
│   ├── db/              # пул pg, раннер миграций, redis-клиент
│   └── docs/            # OpenAPI-спецификация (/api/docs)
└── tests/               # vitest + supertest (testcontainers), unit-тесты сервисов
```

Особенности:

- **Аутентификация**: bcrypt; JWT access (15 мин) + refresh (httpOnly cookie, 30 дней) с ротацией; refresh-токены хранятся в БД (sha256-хэш), отзыв при logout, повторное использование уже отозванного токена инвалидирует все сессии пользователя.
- **Роли** `user`/`admin`: удаление чужих статей и очистка истории — только admin (`requireRole('admin')`). Email из `ADMIN_EMAILS` получает роль admin при регистрации.
- **Rate limiting**: `/api/auth/*` — 20 запросов / 15 мин, глобально — 300 / мин (express-rate-limit + Redis store).
- **Кэш OWM**: ответы по координатам кэшируются в Redis на 30 минут (TTL), геокодинг — на сутки. Ключ API не покидает сервер.
- **Транзакции**: регистрация (users + user_settings), ротация refresh-токена.
- **Graceful shutdown**: по SIGTERM/SIGINT закрываются cron, socket.io, HTTP-сервер, пулы Redis и PostgreSQL.

## Схема БД

```
users                        refresh_tokens
├── id uuid PK               ├── id uuid PK
├── email text UNIQUE        ├── user_id uuid FK → users (CASCADE)
├── password_hash text       ├── token_hash text UNIQUE (sha256)
├── role user|admin          ├── expires_at timestamptz
└── created_at               ├── revoked_at timestamptz NULL
                             └── created_at
user_settings
├── user_id uuid PK FK       city_subscriptions
└── default_city text        ├── id uuid PK
                             ├── user_id uuid FK → users (CASCADE)
articles                     ├── city text  (UNIQUE user_id+city)
├── id uuid PK               ├── address text
├── title text               ├── latitude/longitude numeric(9,6)
├── short_desc text          └── created_at
├── description text
├── author_id uuid FK        pollution_history
├── search_vector tsvector   ├── id uuid PK
│   (GENERATED, GIN-индекс)  ├── user_id uuid FK → users (SET NULL)
└── created_at (индекс)      ├── address text
                             ├── latitude/longitude numeric(9,6) (индекс)
                             ├── components jsonb
                             ├── aqi smallint (1..5)
                             ├── date_time text
                             └── created_at (индекс)
```

## Эндпоинты API

Полная спецификация — Swagger UI на `/api/docs`.

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | публичный | Регистрация, выдаёт access + refresh cookie |
| POST | `/api/auth/login` | публичный | Вход |
| POST | `/api/auth/refresh` | refresh cookie | Ротация refresh, новый access |
| POST | `/api/auth/logout` | refresh cookie | Отзыв текущего refresh-токена |
| POST | `/api/auth/logout-all` | Bearer | Отзыв всех сессий |
| GET | `/api/articles?page=&limit=&sort=&q=` | публичный | Пагинация, сортировка, полнотекстовый поиск (tsvector) |
| GET | `/api/articles/:id` | публичный | Статья по id |
| POST | `/api/articles` | Bearer | Создать статью |
| DELETE | `/api/articles/:id` | Bearer | Удалить свою статью (чужую — admin) |
| DELETE | `/api/articles` | admin | Удалить все статьи |
| GET | `/api/pollutions` | Bearer | История (user — своя, admin — вся) |
| POST | `/api/pollutions` | Bearer | Сохранить запись в историю |
| DELETE | `/api/pollutions` | admin | Очистить историю |
| GET | `/api/pollutions/current?city=` (или `lat=&lon=`) | Bearer | Прокси OWM с Redis-кэшем 30 мин |
| GET | `/api/subscriptions` | Bearer | Мои подписки на города |
| POST | `/api/subscriptions` | Bearer | Подписаться на город |
| DELETE | `/api/subscriptions/:id` | Bearer | Отписаться |
| GET | `/health`, `/ready` | публичный | Liveness / readiness (PostgreSQL + Redis) |
| GET | `/api/docs` | публичный | Swagger UI |

WebSocket (socket.io, auth по access-токену): события `city:subscribe` / `city:unsubscribe`, push `pollution:update` при обновлении данных фоновой задачей (раз в час по городам из подписок).

## Тесты

```bash
npm test          # бэкенд: vitest + supertest, PostgreSQL и Redis в testcontainers
npm run lint      # ESLint (typescript-eslint, type-checked)
npm run typecheck # tsc --noEmit

# e2e фронта (нужны запущенные бэкенд и фронтенд)
npm run cypress:open -w @events-world/frontend
```

## CI

GitHub Actions (`.github/workflows/ci.yml`): на PR и push в `main` — lint, typecheck, тесты бэкенда (testcontainers), сборка фронтенда.
