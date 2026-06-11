# REST API

Базовый URL: `http://localhost:3001`  
Префикс API: `/api`

> **Слой данных:** PostgreSQL 17 через **Prisma ORM** (`backend/src/db/prisma.ts`, репозитории в `backend/src/repositories/`). Схема и миграции — [database.md](./database.md).

---

## Swagger / OpenAPI

В проекте есть **полная машиночитаемая спецификация OpenAPI 3.1** и интерактивный **Swagger UI** — аналог «живой документации» с возможностью вызывать эндпоинты из браузера.

| Ресурс           | URL                                         | Описание                                    |
| ---------------- | ------------------------------------------- | ------------------------------------------- |
| **Swagger UI**   | http://localhost:3001/api/docs              | Интерактивная документация всех эндпоинтов  |
| **OpenAPI JSON** | http://localhost:3001/api/docs/openapi.json | Спецификация для Postman, Insomnia, codegen |
| **Исходник**     | `backend/src/docs/openapi.ts`               | Единый источник правды для Swagger          |

Swagger UI подключается в `backend/src/app.ts` через `swagger-ui-express`.

**Покрытие спецификации:**

- Health (`/health`, `/ready`)
- Auth (register, login, refresh, logout, logout-all)
- Articles (CRUD, пагинация, поиск)
- Pollutions (история, current-прокси, очистка)
- Subscriptions (подписки на города)
- Схемы: `User`, `AuthResult`, `Article`, `PollutionRecord`, `Subscription`, `Error`
- Security: `bearerAuth` (JWT), `refreshCookie` (`refreshToken`)

> Дополнительные детали (WebSocket, sequence-диаграммы auth) — в [README](../README.md#аутентификация-и-авторизация).

---

## Формат ошибок

Все ошибки API возвращаются в едином формате:

```json
{
  "message": "Описание ошибки",
  "code": "VALIDATION_ERROR",
  "details": {},
  "requestId": "uuid"
}
```

| HTTP | code                               | Когда                            |
| ---- | ---------------------------------- | -------------------------------- |
| 400  | `VALIDATION_ERROR` / `BAD_REQUEST` | Невалидные данные (zod)          |
| 401  | `UNAUTHORIZED`                     | Нет/истёк токен                  |
| 403  | `FORBIDDEN`                        | Недостаточно прав                |
| 404  | `NOT_FOUND`                        | Ресурс не найден                 |
| 409  | `CONFLICT`                         | Дубликат email, подписка         |
| 429  | `TOO_MANY_REQUESTS`                | Rate limit                       |
| 500  | `INTERNAL_ERROR`                   | Внутренняя ошибка                |
| 502  | —                                  | Ошибка upstream (OpenWeatherMap) |

---

## Аутентификация

| Метод  | Путь                   | Доступ                | Описание                      |
| ------ | ---------------------- | --------------------- | ----------------------------- |
| `POST` | `/api/auth/register`   | публичный             | Регистрация                   |
| `POST` | `/api/auth/login`      | публичный             | Вход                          |
| `POST` | `/api/auth/refresh`    | cookie `refreshToken` | Ротация refresh, новый access |
| `POST` | `/api/auth/logout`     | cookie `refreshToken` | Отзыв текущего refresh        |
| `POST` | `/api/auth/logout-all` | Bearer JWT            | Отзыв всех сессий             |

### Register / Login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response (201 register / 200 login):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
  "accessToken": "eyJ..."
}
```

**Cookie:** `Set-Cookie: refreshToken=...; HttpOnly; Path=/api/auth; SameSite=Lax; Max-Age=2592000`

### Refresh

`POST /api/auth/refresh` — без тела, с cookie. Возвращает новый `accessToken` и обновляет cookie.

### Logout

`POST /api/auth/logout` → `204 No Content`, cookie очищается.

---

## Статьи

| Метод    | Путь                | Доступ    | Описание                      |
| -------- | ------------------- | --------- | ----------------------------- |
| `GET`    | `/api/articles`     | публичный | Список с пагинацией и поиском |
| `GET`    | `/api/articles/:id` | публичный | Статья по UUID                |
| `POST`   | `/api/articles`     | Bearer    | Создать статью                |
| `DELETE` | `/api/articles/:id` | Bearer    | Удалить (свою; admin — любую) |
| `DELETE` | `/api/articles`     | admin     | Удалить все статьи            |

### `GET /api/articles`

| Query   | Тип       | Default           | Описание                                                       |
| ------- | --------- | ----------------- | -------------------------------------------------------------- |
| `page`  | int ≥ 1   | `1`               | Страница                                                       |
| `limit` | int 1–100 | `10`              | Размер страницы                                                |
| `sort`  | enum      | `created_at:desc` | `created_at:desc`, `created_at:asc`, `title:asc`, `title:desc` |
| `q`     | string    | —                 | Полнотекстовый поиск (`tsvector`, русский)                     |

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Заголовок",
      "short_desc": "Кратко",
      "description": "Полный текст",
      "author_id": "uuid",
      "created_at": "2026-06-10T12:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### `POST /api/articles`

```json
{
  "title": "Заголовок",
  "short_desc": "Опционально",
  "description": "Текст статьи"
}
```

---

## Загрязнение воздуха

| Метод    | Путь                      | Доступ | Описание                           |
| -------- | ------------------------- | ------ | ---------------------------------- |
| `GET`    | `/api/pollutions/current` | Bearer | Прокси OpenWeatherMap + Redis-кэш  |
| `GET`    | `/api/pollutions`         | Bearer | История (user — своя, admin — вся) |
| `POST`   | `/api/pollutions`         | Bearer | Сохранить запись                   |
| `DELETE` | `/api/pollutions`         | admin  | Очистить всю историю               |

### `GET /api/pollutions/current`

Один из вариантов query (обязателен):

| Вариант        | Query                                 | Описание                              |
| -------------- | ------------------------------------- | ------------------------------------- |
| По городу      | `?city=Moscow`                        | Геокодинг OWM → запрос по координатам |
| По координатам | `?lat=55.75&lon=37.61&address=Москва` | Прямой запрос; `address` опционален   |

Кэш Redis: ключ `owm:air:{lat}:{lon}`, TTL 30 мин. Геокодинг кэшируется 24 ч.

**Response:**

```json
{
  "address": "Moscow",
  "latitude": "55.755800",
  "longitude": "37.617300",
  "components": {
    "co": 233.45,
    "no": 0.01,
    "no2": 12.3,
    "o3": 45.6,
    "so2": 1.2,
    "pm2_5": 8.9,
    "pm10": 15.1,
    "nh3": 0.5
  },
  "aqi": 2,
  "dateTime": "10.06.2026 12:00:00",
  "measuredAt": 1749556800
}
```

**AQI:** 1 Good · 2 Fair · 3 Moderate · 4 Poor · 5 Very Poor

### `POST /api/pollutions`

```json
{
  "address": "Moscow",
  "latitude": "55.7558",
  "longitude": "37.6173",
  "components": {
    "co": 233.45,
    "no": 0.01,
    "no2": 12.3,
    "o3": 45.6,
    "so2": 1.2,
    "pm2_5": 8.9,
    "pm10": 15.1,
    "nh3": 0.5
  },
  "aqi": 2,
  "dateTime": "10.06.2026 12:00:00"
}
```

---

## Подписки на города

| Метод    | Путь                     | Доступ | Описание        |
| -------- | ------------------------ | ------ | --------------- |
| `GET`    | `/api/subscriptions`     | Bearer | Список подписок |
| `POST`   | `/api/subscriptions`     | Bearer | Подписаться     |
| `DELETE` | `/api/subscriptions/:id` | Bearer | Отписаться      |

**POST body:**

```json
{ "city": "Moscow" }
```

Сервер геокодирует город, сохраняет координаты. При дубликате `(user_id, city)` → `409`.

Подписка участвует в cron-обновлении (раз в час) и WebSocket push (`pollution:update`).

---

## Health

| Метод | Путь      | Auth | Response                                                               |
| ----- | --------- | ---- | ---------------------------------------------------------------------- |
| `GET` | `/health` | нет  | `{ "status": "ok", "uptime": 123.45 }`                                 |
| `GET` | `/ready`  | нет  | `{ "status": "ready", "checks": { "postgres": "ok", "redis": "ok" } }` |

`/ready` → `503` если PostgreSQL (через Prisma `$queryRaw`) или Redis недоступны.

---

## Rate limiting

| Область       | Лимит       | Store                |
| ------------- | ----------- | -------------------- |
| `/api/auth/*` | 20 / 15 мин | Redis (`rl:auth:`)   |
| `/api/*`      | 300 / мин   | Redis (`rl:global:`) |

Отключение: `RATE_LIMIT_ENABLED=false` (в тестах отключено автоматически).

При превышении: `429` + `{ "code": "TOO_MANY_REQUESTS" }`.

---

## WebSocket (socket.io)

Не входит в OpenAPI, но является частью API-поверхности.

**URL:** тот же хост/порт, что и HTTP (например `http://localhost:3001`).

**Auth:** `handshake.auth.token` = access JWT.

| Направление     | Событие            | Payload               |
| --------------- | ------------------ | --------------------- |
| client → server | `city:subscribe`   | `string` (город)      |
| client → server | `city:unsubscribe` | `string`              |
| server → client | `pollution:update` | `CurrentPollutionDto` |

Комнаты: `city:<город в lower case>`.
