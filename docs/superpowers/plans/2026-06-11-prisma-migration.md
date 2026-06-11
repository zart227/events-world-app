# Prisma Migration Implementation Plan

> **Статус: ВЫПОЛНЕНО** (ветка `feat/prisma-migration`). Документация: [README.md](../../README.md), [database.md](../../database.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью заменить `pg` + ручные SQL-миграции + слой repositories на Prisma ORM с автоматическими миграциями, сохранив всё текущее поведение API.

**Architecture:** Единый `PrismaClient` (`backend/src/db/prisma.ts`) вместо `pool.ts`. Репозитории остаются как тонкие обёртки над Prisma (интерфейс для services не меняется). PostgreSQL-специфика (`tsvector`, `array_agg`, `count(*) OVER ()`) — через `$queryRaw` / `Prisma.sql`. Миграции — `prisma migrate`; на старте сервера — `prisma migrate deploy`.

**Tech Stack:** Prisma 6.x, `@prisma/client`, PostgreSQL 17, Node.js 22 ESM, Vitest + testcontainers.

**Оценка:** ~2–3 рабочих дня, 7 фаз, ~35 задач.

---

## Карта изменений

| Действие   | Файлы                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Создать    | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/db/prisma.ts`                                                                          |
| Переписать | `backend/src/repositories/*.ts` (5 файлов)                                                                                                                        |
| Изменить   | `server.ts`, `health.router.ts`, `token.service.ts`, `tests/helpers.ts`, `tests/auth.flow.test.ts`, `package.json`, `Dockerfile`, `README.md`, `docs/database.md` |
| Удалить    | `backend/src/db/pool.ts`, `backend/src/db/migrate.ts`, `backend/src/db/migrate-cli.ts`, `backend/migrations/*.sql`                                                |

---

## Риски и решения

| Риск                                     | Решение                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `search_vector` — GENERATED `tsvector`   | `Unsupported("tsvector")` в schema + ручной SQL в миграции Prisma                               |
| Полнотекстовый поиск                     | `$queryRaw` в `article.repository.ts`                                                           |
| `ON CONFLICT DO NOTHING` (подписки)      | `create` + catch `P2002` или `$executeRaw`                                                      |
| `array_agg` + `GROUP BY` (cron)          | `$queryRaw` в `subscription.repository.ts`                                                      |
| Транзакции (регистрация, ротация токена) | `prisma.$transaction()`                                                                         |
| Существующие БД с `schema_migrations`    | Одноразовый baseline + `prisma migrate resolve`                                                 |
| ESM (`"type": "module"`)                 | `generator client { provider = "prisma-client" output = "../src/generated/prisma" }` (Prisma 6) |

---

## Фаза 0 — Подготовка

### Task 0.1: Ветка и бэкап

- [ ] Создать ветку `feat/prisma-migration`
- [ ] Убедиться, что `npm test -w @events-world/backend` проходит на текущем `main`
- [ ] Зафиксировать текущую схему: `pg_dump --schema-only` (опционально, для сверки)

---

## Фаза 1 — Установка Prisma

### Task 1.1: Зависимости

**Files:**

- Modify: `backend/package.json`

- [ ] Установить зависимости:

```bash
cd backend
npm install @prisma/client
npm install -D prisma
```

- [ ] Добавить скрипты в `backend/package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "schema": "prisma/schema.prisma"
  }
}
```

- [ ] Добавить `backend/src/generated/` в `.gitignore` **или** коммитить generated client (рекомендуется gitignore + `postinstall` / `db:generate` в CI и Docker build)

---

### Task 1.2: schema.prisma

**Files:**

- Create: `backend/prisma/schema.prisma`

- [ ] Создать полную схему:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  user
  admin

  @@map("user_role")
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         String   @default("user") // CHECK в миграции: user|admin
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  settings      UserSettings?
  refreshTokens RefreshToken[]
  articles      Article[]
  pollution     PollutionHistory[]
  subscriptions CitySubscription[]

  @@map("users")
}

model UserSettings {
  userId      String   @id @map("user_id") @db.Uuid
  defaultCity String?  @map("default_city")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model RefreshToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash")
  expiresAt DateTime  @map("expires_at") @db.Timestamptz(6)
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], map: "idx_refresh_tokens_user_id")
  @@index([expiresAt], map: "idx_refresh_tokens_expires_at")
  @@map("refresh_tokens")
}

model Article {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title        String
  shortDesc    String?  @map("short_desc")
  description  String
  authorId     String?  @map("author_id") @db.Uuid
  searchVector Unsupported("tsvector")? @map("search_vector")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  author User? @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([createdAt(sort: Desc)], map: "idx_articles_created_at")
  @@index([authorId], map: "idx_articles_author_id")
  @@map("articles")
}

model PollutionHistory {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  address    String
  latitude   Decimal  @db.Decimal(9, 6)
  longitude  Decimal  @db.Decimal(9, 6)
  components Json
  aqi        Int      @db.SmallInt
  dateTime   String   @map("date_time")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([createdAt], map: "idx_pollution_history_created_at")
  @@index([latitude, longitude], map: "idx_pollution_history_coords")
  @@map("pollution_history")
}

model CitySubscription {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  city      String
  address   String
  latitude  Decimal  @db.Decimal(9, 6)
  longitude Decimal  @db.Decimal(9, 6)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, city])
  @@index([userId], map: "idx_city_subscriptions_user_id")
  @@index([city], map: "idx_city_subscriptions_city")
  @@map("city_subscriptions")
}
```

> **Примечание:** `role` оставляем `String` с CHECK в SQL-миграции (как сейчас), чтобы не ломать существующие данные. `UserRole` enum — опционально, если решите мигрировать на native enum позже.

---

### Task 1.3: Baseline-миграция

**Files:**

- Create: `backend/prisma/migrations/20260611000000_init/migration.sql`

- [ ] Поднять чистый PostgreSQL (`docker compose up postgres -d`)
- [ ] Сгенерировать начальную миграцию:

```bash
cd backend
npx prisma migrate dev --name init --create-only
```

- [ ] **Вручную дописать** в `migration.sql` после CREATE TABLE articles:

```sql
-- CHECK constraints (Prisma не генерирует все CHECK)
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
ALTER TABLE pollution_history ADD CONSTRAINT pollution_history_aqi_check CHECK (aqi BETWEEN 1 AND 5);

-- Полнотекстовый поиск (GENERATED COLUMN — только raw SQL)
ALTER TABLE articles
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(short_desc, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX idx_articles_search_vector ON articles USING GIN (search_vector);
```

- [ ] Удалить дублирующий `ADD COLUMN search_vector` из auto-generated SQL, если Prisma попытался создать колонку иначе
- [ ] Применить: `npx prisma migrate dev`
- [ ] Сгенерировать клиент: `npx prisma generate`

---

## Фаза 2 — Prisma Client и инфраструктура

### Task 2.1: Singleton PrismaClient

**Files:**

- Create: `backend/src/db/prisma.ts`
- Delete (позже): `backend/src/db/pool.ts`

- [ ] Создать `backend/src/db/prisma.ts`:

```typescript
import { PrismaClient } from '../generated/prisma/client.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export async function runMigrations(): Promise<void> {
  const { execSync } = await import('node:child_process');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: import.meta.dirname + '/../..' });
}
```

> **Альтернатива:** вызывать `prisma migrate deploy` только из CLI/Docker entrypoint, не из `server.ts` — безопаснее для production. Выбрать один подход и придерживаться его.

---

### Task 2.2: server.ts

**Files:**

- Modify: `backend/src/server.ts`

- [ ] Заменить импорты:

```diff
- import { runMigrations } from './db/migrate.js';
- import { closePool, pool } from './db/pool.js';
+ import { disconnectPrisma, runMigrations, connectPrisma } from './db/prisma.js';
```

- [ ] В `main()`:

```diff
  await runMigrations(pool);
+ await connectPrisma();
```

- [ ] В shutdown:

```diff
- await closePool();
+ await disconnectPrisma();
```

---

### Task 2.3: health.router.ts

**Files:**

- Modify: `backend/src/routes/health.router.ts`

- [ ] Заменить `pool.query('SELECT 1')` на:

```typescript
await prisma.$queryRaw`SELECT 1`;
```

---

### Task 2.4: token.service.ts — транзакции

**Files:**

- Modify: `backend/src/services/token.service.ts`

- [ ] Заменить `withTransaction` из `pool.ts` на `prisma.$transaction(async (tx) => { ... })`
- [ ] Передавать `tx` (тип `Prisma.TransactionClient`) в методы репозитория вместо `pg.PoolClient`

---

## Фаза 3 — Репозитории

> Сохраняем файлы `repositories/*.ts` и экспортируемые типы — services менять минимально.

### Task 3.1: user.repository.ts

**Files:**

- Modify: `backend/src/repositories/user.repository.ts`

- [ ] `createWithSettings`:

```typescript
return prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
      settings: { create: {} },
    },
  });
  return toEntity(user);
});
```

- [ ] `findByEmail` / `findById` → `prisma.user.findUnique`
- [ ] Маппинг `UserEntity`: `password_hash` ← `passwordHash`, `created_at` ← `createdAt`
- [ ] Параметр `client` заменить на `tx?: Prisma.TransactionClient`

---

### Task 3.2: refresh-token.repository.ts

**Files:**

- Modify: `backend/src/repositories/refresh-token.repository.ts`

| Метод              | Prisma                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `create`           | `tx.refreshToken.create`                                                          |
| `findByHash`       | `findUnique({ where: { tokenHash } })`                                            |
| `revokeById`       | `updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } })` |
| `revokeAllForUser` | `updateMany` → вернуть `count`                                                    |
| `deleteExpired`    | `deleteMany({ where: { expiresAt: { lt: new Date() } } })` → `count`              |

---

### Task 3.3: article.repository.ts

**Files:**

- Modify: `backend/src/repositories/article.repository.ts`

- [ ] `create`, `findById`, `findAll`, `deleteById`, `deleteAll` — стандартный Prisma CRUD
- [ ] **`findPage` и `countSearch`** — оставить `$queryRaw` (полнотекст + window function):

```typescript
import { Prisma } from '../generated/prisma/client.js';

const rows = await prisma.$queryRaw<ArticleRowWithTotal[]>`
  SELECT id, title, short_desc, description, author_id, created_at,
         count(*) OVER () AS total
  FROM articles
  WHERE ${search === null ? Prisma.sql`true` : Prisma.sql`search_vector @@ websearch_to_tsquery('russian', ${search})`}
  ORDER BY ${Prisma.raw(orderBy)}
  LIMIT ${query.limit} OFFSET ${offset}
`;
```

> **Безопасность:** `orderBy` — только из белого списка `sortMap` (как сейчас), никогда из пользовательского ввода напрямую.

---

### Task 3.4: pollution.repository.ts

**Files:**

- Modify: `backend/src/repositories/pollution.repository.ts`

- [ ] `create` → `prisma.pollutionHistory.create` с `Decimal` для lat/lon
- [ ] `findAll` / `findAllByUser` → `findMany({ orderBy: { createdAt: 'asc' } })`
- [ ] `deleteAll` → `deleteMany()` → `count`
- [ ] Маппинг `Decimal` → string (сохранить текущую логику `Number.parseFloat`)

---

### Task 3.5: subscription.repository.ts

**Files:**

- Modify: `backend/src/repositories/subscription.repository.ts`

- [ ] `create` с `ON CONFLICT DO NOTHING`:

```typescript
try {
  const row = await prisma.citySubscription.create({ data: { ... } });
  return toDto(row);
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return null;
  }
  throw e;
}
```

- [ ] `findAllByUser`, `deleteByIdForUser` — стандартный Prisma
- [ ] **`findCitiesWithSubscribers`** — `$queryRaw`:

```typescript
return prisma.$queryRaw<CityRow[]>`
  SELECT city,
         min(address) AS address,
         min(latitude) AS latitude,
         min(longitude) AS longitude,
         array_agg(DISTINCT user_id) AS user_ids
  FROM city_subscriptions
  GROUP BY city
`;
```

---

## Фаза 4 — Тесты

### Task 4.1: helpers.ts

**Files:**

- Modify: `backend/tests/helpers.ts`

- [ ] Заменить `runMigrations(pool)` → `runMigrations()` из `prisma.ts`
- [ ] `truncateAll`:

```typescript
export async function truncateAll(): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE users, refresh_tokens, user_settings, articles,
             pollution_history, city_subscriptions CASCADE
  `;
  await redis.flushAll();
}
```

---

### Task 4.2: auth.flow.test.ts

**Files:**

- Modify: `backend/tests/auth.flow.test.ts`

- [ ] Заменить прямые `pool.query` на Prisma:

```typescript
const settings = await prisma.userSettings.findUnique({ where: { userId: res.body.user.id } });
expect(settings).not.toBeNull();

const user = await prisma.user.findUnique({
  where: { id: user.id },
  select: { passwordHash: true },
});
expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
```

---

### Task 4.3: Unit-тесты

**Files:**

- Modify: `backend/tests/unit/auth.service.test.ts`, `article.service.test.ts`

- [ ] Моки repositories **не менять** — services по-прежнему импортируют `userRepository`, `articleRepository`
- [ ] Прогнать: `npm test -w @events-world/backend`

---

### Task 4.4: Интеграционные тесты

- [ ] `auth.flow.test.ts`, `articles.test.ts`, `pollutions.test.ts`, `subscriptions.test.ts` — все зелёные
- [ ] Особое внимание: полнотекстовый поиск (`q=кактус`), пагинация, подписки `ON CONFLICT`

---

## Фаза 5 — Docker и CI

### Task 5.1: Dockerfile

**Files:**

- Modify: `backend/Dockerfile`

- [ ] В stage `deps`: копировать `backend/prisma/`
- [ ] В stage `build`: добавить `RUN npx prisma generate -w @events-world/backend` (или из `/app/backend`)
- [ ] В `runtime`: копировать `backend/prisma/` (для `migrate deploy`)
- [ ] Удалить `COPY backend/migrations`
- [ ] Опционально: entrypoint-скрипт:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node backend/dist/server.js"]
```

---

### Task 5.2: CI

**Files:**

- Modify: `.github/workflows/ci.yml` (если нужно)

- [ ] Добавить шаг перед тестами:

```yaml
- name: Generate Prisma Client
  run: npm run db:generate -w @events-world/backend
```

- [ ] Убедиться, что testcontainers + `prisma migrate deploy` в тестах работают

---

### Task 5.3: Корневой package.json

**Files:**

- Modify: `package.json` (root)

- [ ] Обновить скрипт `migrate`:

```json
"migrate": "npm run db:migrate:deploy -w @events-world/backend"
```

---

## Фаза 6 — Удаление legacy

### Task 6.1: Удалить старый data layer

- [ ] Удалить `backend/src/db/pool.ts`
- [ ] Удалить `backend/src/db/migrate.ts`
- [ ] Удалить `backend/src/db/migrate-cli.ts`
- [ ] Удалить `backend/migrations/*.sql`
- [ ] Удалить зависимости: `pg`, `@types/pg`
- [ ] Удалить `PG_POOL_SIZE` из `env.ts` (опционально — Prisma pool через `?connection_limit=10` в DATABASE_URL)

---

### Task 6.2: Миграция существующих БД

Для dev/staging БД, где уже применены SQL-миграции `0001–0004`:

- [ ] `npx prisma migrate resolve --applied 20260611000000_init`
- [ ] Удалить таблицу `schema_migrations` (больше не нужна)
- [ ] Проверить `npx prisma migrate status` → «Database schema is up to date»

Для **чистых** БД — просто `prisma migrate deploy`.

---

## Фаза 7 — Документация

### Task 7.1: README.md

- [ ] Стек: `PostgreSQL (Prisma ORM)` вместо `pg, чистый SQL`
- [ ] Структура: `prisma/` вместо `migrations/`
- [ ] Команды: `npm run db:migrate`, `npm run db:studio`
- [ ] Убрать упоминания `PG_POOL_SIZE` или описать `connection_limit`

### Task 7.2: docs/database.md

- [ ] Переписать раздел «Миграции» под Prisma Migrate
- [ ] Исправить `_migrations` → `_prisma_migrations`
- [ ] Добавить workflow: изменил schema → `prisma migrate dev` → коммит `prisma/migrations/`

### Task 7.3: docs/api.md

- [ ] Без изменений API — только при необходимости

---

## Чеклист финальной проверки

- [ ] `npm run typecheck -w @events-world/backend`
- [ ] `npm run lint -w @events-world/backend`
- [ ] `npm test -w @events-world/backend`
- [ ] `docker compose up --build` — backend стартует, `/ready` → 200
- [ ] `npx prisma studio` — схема корректна
- [ ] Регистрация + refresh rotation + статьи + поиск + подписки — ручная проверка

---

## Порядок коммитов (рекомендуемый)

1. `chore: add prisma dependencies and schema`
2. `feat: add baseline prisma migration with tsvector`
3. `feat: replace pg pool with prisma client`
4. `refactor: migrate user and refresh-token repositories to prisma`
5. `refactor: migrate article repository with raw fulltext queries`
6. `refactor: migrate pollution and subscription repositories`
7. `test: update tests for prisma`
8. `chore: update docker and ci for prisma`
9. `docs: update database docs for prisma`
10. `chore: remove legacy pg migrations and pool`

---

## Execution Handoff

**Plan saved to `docs/superpowers/plans/2026-06-11-prisma-migration.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — отдельный сабагент на каждую фазу, ревью между фазами
2. **Inline Execution** — выполнение в текущей сессии по фазам с чекпоинтами
