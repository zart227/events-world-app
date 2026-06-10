/**
 * OpenAPI 3.1 спецификация API. Доступна в Swagger UI на /api/docs.
 */

const errorResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' },
    details: {},
    requestId: { type: 'string' },
  },
} as const;

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['user', 'admin'] },
  },
} as const;

const authResultSchema = {
  type: 'object',
  properties: {
    user: userSchema,
    accessToken: { type: 'string', description: 'JWT, срок жизни 15 минут' },
  },
} as const;

const credentialsSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
  },
} as const;

const pollutionComponents = {
  type: 'object',
  properties: Object.fromEntries(
    ['co', 'no', 'no2', 'o3', 'so2', 'pm2_5', 'pm10', 'nh3'].map((k) => [k, { type: 'number' }]),
  ),
} as const;

const pollutionRecord = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    address: { type: 'string' },
    latitude: { type: 'string' },
    longitude: { type: 'string' },
    components: pollutionComponents,
    aqi: { type: 'integer', minimum: 1, maximum: 5 },
    dateTime: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
  },
} as const;

const articleSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    short_desc: { type: 'string' },
    description: { type: 'string' },
    author_id: { type: 'string', format: 'uuid', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
  },
} as const;

const subscriptionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    city: { type: 'string' },
    address: { type: 'string' },
    latitude: { type: 'string' },
    longitude: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
  },
} as const;

function jsonBody(schema: unknown) {
  return { required: true, content: { 'application/json': { schema } } };
}

function jsonResponse(description: string, schema?: unknown) {
  return schema
    ? { description, content: { 'application/json': { schema } } }
    : { description };
}

const standardErrors = {
  '400': jsonResponse('Ошибка валидации', errorResponse),
  '401': jsonResponse('Не авторизован', errorResponse),
  '403': jsonResponse('Недостаточно прав', errorResponse),
  '404': jsonResponse('Не найдено', errorResponse),
} as const;

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Events World API',
    version: '1.0.0',
    description:
      'API мониторинга загрязнения воздуха: аутентификация (JWT + refresh-cookie), статьи, история запросов, подписки на города, прокси к OpenWeatherMap с Redis-кэшем.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refreshToken' },
    },
    schemas: {
      Error: errorResponse,
      User: userSchema,
      AuthResult: authResultSchema,
      Credentials: credentialsSchema,
      PollutionComponents: pollutionComponents,
      PollutionRecord: pollutionRecord,
      Article: articleSchema,
      Subscription: subscriptionSchema,
    },
  },
  paths: {
    '/health': {
      get: { tags: ['Health'], summary: 'Liveness', responses: { '200': jsonResponse('OK') } },
    },
    '/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness (PostgreSQL + Redis)',
        responses: { '200': jsonResponse('Ready'), '503': jsonResponse('Not ready') },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация',
        requestBody: jsonBody(credentialsSchema),
        responses: {
          '201': jsonResponse('Создан. Refresh-токен ставится в httpOnly cookie', authResultSchema),
          '400': standardErrors['400'],
          '409': jsonResponse('Email уже занят', errorResponse),
          '429': jsonResponse('Rate limit', errorResponse),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Вход',
        requestBody: jsonBody(credentialsSchema),
        responses: {
          '200': jsonResponse('OK', authResultSchema),
          '401': standardErrors['401'],
          '429': jsonResponse('Rate limit', errorResponse),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Ротация refresh-токена, новый access-токен',
        security: [{ refreshCookie: [] }],
        responses: { '200': jsonResponse('OK', authResultSchema), '401': standardErrors['401'] },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Выход (отзыв refresh-токена)',
        security: [{ refreshCookie: [] }],
        responses: { '204': jsonResponse('Выход выполнен') },
      },
    },
    '/api/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'Отзыв всех сессий пользователя',
        security: [{ bearerAuth: [] }],
        responses: { '204': jsonResponse('Все сессии отозваны'), '401': standardErrors['401'] },
      },
    },
    '/api/articles': {
      get: {
        tags: ['Articles'],
        summary: 'Список статей: пагинация, сортировка, полнотекстовый поиск',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['created_at:desc', 'created_at:asc', 'title:asc', 'title:desc'],
              default: 'created_at:desc',
            },
          },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Поисковый запрос (tsvector)' },
        ],
        responses: {
          '200': jsonResponse('Страница статей', {
            type: 'object',
            properties: {
              items: { type: 'array', items: articleSchema },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          }),
        },
      },
      post: {
        tags: ['Articles'],
        summary: 'Создать статью',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            short_desc: { type: 'string' },
            description: { type: 'string' },
          },
        }),
        responses: { '201': jsonResponse('Создана', articleSchema), ...standardErrors },
      },
      delete: {
        tags: ['Articles'],
        summary: 'Удалить все статьи (только admin)',
        security: [{ bearerAuth: [] }],
        responses: { '204': jsonResponse('Удалены'), ...standardErrors },
      },
    },
    '/api/articles/{id}': {
      get: {
        tags: ['Articles'],
        summary: 'Статья по id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': jsonResponse('OK', articleSchema), '404': standardErrors['404'] },
      },
      delete: {
        tags: ['Articles'],
        summary: 'Удалить статью (свою; чужую — только admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': jsonResponse('Удалена'), ...standardErrors },
      },
    },
    '/api/pollutions': {
      get: {
        tags: ['Pollutions'],
        summary: 'История запросов (user — своя, admin — вся)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': jsonResponse('OK', { type: 'array', items: pollutionRecord }),
          '401': standardErrors['401'],
        },
      },
      post: {
        tags: ['Pollutions'],
        summary: 'Сохранить запись в историю',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({
          type: 'object',
          required: ['address', 'latitude', 'longitude', 'components', 'aqi', 'dateTime'],
          properties: {
            address: { type: 'string' },
            latitude: { type: 'string' },
            longitude: { type: 'string' },
            components: pollutionComponents,
            aqi: { type: 'integer', minimum: 1, maximum: 5 },
            dateTime: { type: 'string' },
          },
        }),
        responses: { '201': jsonResponse('Сохранено', pollutionRecord), ...standardErrors },
      },
      delete: {
        tags: ['Pollutions'],
        summary: 'Очистить историю (только admin)',
        security: [{ bearerAuth: [] }],
        responses: { '204': jsonResponse('Очищена'), ...standardErrors },
      },
    },
    '/api/pollutions/current': {
      get: {
        tags: ['Pollutions'],
        summary: 'Текущее загрязнение по городу (прокси OWM, Redis-кэш 30 мин)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'city', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': jsonResponse('OK', {
            type: 'object',
            properties: {
              address: { type: 'string' },
              latitude: { type: 'string' },
              longitude: { type: 'string' },
              components: pollutionComponents,
              aqi: { type: 'integer' },
              dateTime: { type: 'string' },
              measuredAt: { type: 'integer' },
            },
          }),
          '404': standardErrors['404'],
          '502': jsonResponse('Ошибка OpenWeatherMap', errorResponse),
        },
      },
    },
    '/api/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: 'Мои подписки на города',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': jsonResponse('OK', { type: 'array', items: subscriptionSchema }),
          '401': standardErrors['401'],
        },
      },
      post: {
        tags: ['Subscriptions'],
        summary: 'Подписаться на город (push через WebSocket + cron-обновления)',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({
          type: 'object',
          required: ['city'],
          properties: { city: { type: 'string' } },
        }),
        responses: {
          '201': jsonResponse('Подписка создана', subscriptionSchema),
          '409': jsonResponse('Уже подписан', errorResponse),
          ...standardErrors,
        },
      },
    },
    '/api/subscriptions/{id}': {
      delete: {
        tags: ['Subscriptions'],
        summary: 'Отписаться',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': jsonResponse('Отписан'), '404': standardErrors['404'] },
      },
    },
  },
} as const;
