# Документация events-world-app

| Документ                         | Описание                                                           |
| -------------------------------- | ------------------------------------------------------------------ |
| [api.md](./api.md)               | REST API: эндпоинты, примеры, rate limiting, Swagger/OpenAPI       |
| [database.md](./database.md)     | **Prisma ORM**: schema, модели, миграции, репозитории, `$queryRaw` |
| [components.md](./components.md) | Библиотека компонентов фронта + Storybook                          |

**Интерактивная спецификация API (Swagger UI):** http://localhost:3001/api/docs  
**OpenAPI JSON:** http://localhost:3001/api/docs/openapi.json

Исходник спецификации: `backend/src/docs/openapi.ts`

## Быстрые команды (бэкенд / БД)

```bash
npm run db:generate -w @events-world/backend   # Prisma Client
npm run db:migrate -w @events-world/backend    # dev: новая миграция
npm run migrate                                # deploy миграций
npm run db:studio -w @events-world/backend     # GUI
```

Схема: `backend/prisma/schema.prisma` · Клиент: `backend/src/db/prisma.ts`
