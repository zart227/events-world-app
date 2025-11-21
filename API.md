# API Documentation

## Общая информация

API для приложения мониторинга загрязнения воздуха и управления статьями.

**Базовый URL:** `http://localhost:3001/api`

**Формат данных:** JSON

**Кодировка:** UTF-8

---

## Аутентификация

В текущей версии API аутентификация не требуется для большинства эндпоинтов. Аутентификация реализована через email и password, но токены не используются.

---

## Эндпоинты

### 1. Аутентификация (`/api/auth`)

#### 1.1 Регистрация пользователя

**POST** `/api/auth/register`

Создает нового пользователя в системе.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Параметры:**
- `email` (string, обязательный) - Email пользователя
- `password` (string, обязательный) - Пароль пользователя

**Успешный ответ:** `201 Created`
```json
{
  "id": "uuid-v4",
  "email": "user@example.com"
}
```

**Ошибки:**
- `400 Bad Request` - Пользователь с таким email уже существует
```json
{
  "message": "Пользователь с таким email уже существует"
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

#### 1.2 Вход в систему

**POST** `/api/auth/login`

Авторизует пользователя в системе.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Параметры:**
- `email` (string, обязательный) - Email пользователя
- `password` (string, обязательный) - Пароль пользователя

**Успешный ответ:** `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "user@example.com"
}
```

**Ошибки:**
- `401 Unauthorized` - Неверный email или пароль
```json
{
  "message": "Неверный email или пароль"
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### 2. Загрязнение воздуха (`/api/pollutions`)

#### 2.1 Сохранение данных о загрязнении

**POST** `/api/pollutions`

Сохраняет данные о загрязнении воздуха в базу данных.

**Тело запроса:**
```json
{
  "address": "Москва, Россия",
  "latitude": 55.7558,
  "longitude": 37.6173,
  "components": {
    "co": 201.94,
    "no": 0.18,
    "no2": 0.92,
    "o3": 68.66,
    "so2": 0.77,
    "pm2_5": 4.67,
    "pm10": 6.04,
    "nh3": 0.12
  },
  "aqi": 1,
  "dateTime": "2024-01-15T10:30:00Z"
}
```

**Параметры:**
- `address` (string, обязательный) - Адрес локации
- `latitude` (number, обязательный) - Широта координат
- `longitude` (number, обязательный) - Долгота координат
- `components` (object, обязательный) - Компоненты загрязнения воздуха
  - `co` (number) - Концентрация CO (углеродный монооксид)
  - `no` (number) - Концентрация NO (оксид азота)
  - `no2` (number) - Концентрация NO₂ (диоксид азота)
  - `o3` (number) - Концентрация O₃ (озон)
  - `so2` (number) - Концентрация SO₂ (диоксид серы)
  - `pm2_5` (number) - Концентрация PM2.5 (мелкие частицы)
  - `pm10` (number) - Концентрация PM10 (крупные частицы)
  - `nh3` (number) - Концентрация NH₃ (аммиак)
- `aqi` (number, обязательный) - Индекс качества воздуха (Air Quality Index)
- `dateTime` (string, обязательный) - Дата и время измерения в формате ISO 8601

**Успешный ответ:** `201 Created`
```json
{
  "acknowledged": true,
  "insertedId": "507f1f77bcf86cd799439011"
}
```

**Ошибки:**
- `400 Bad Request` - Отсутствуют обязательные поля
```json
{
  "message": "Необходимы все поля: address, latitude, longitude, components, aqi, dateTime"
}
```

- `500 Internal Server Error` - Ошибка при сохранении данных
```json
{
  "message": "Ошибка при сохранении данных о загрязнении",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/pollutions \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Москва, Россия",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "components": {
      "co": 201.94,
      "no": 0.18,
      "no2": 0.92,
      "o3": 68.66,
      "so2": 0.77,
      "pm2_5": 4.67,
      "pm10": 6.04,
      "nh3": 0.12
    },
    "aqi": 1,
    "dateTime": "2024-01-15T10:30:00Z"
  }'
```

---

#### 2.2 Получение истории загрязнения

**GET** `/api/pollutions`

Возвращает всю историю сохраненных данных о загрязнении воздуха.

**Параметры запроса:** Нет

**Успешный ответ:** `200 OK`
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "address": "Москва, Россия",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "components": {
      "co": 201.94,
      "no": 0.18,
      "no2": 0.92,
      "o3": 68.66,
      "so2": 0.77,
      "pm2_5": 4.67,
      "pm10": 6.04,
      "nh3": 0.12
    },
    "aqi": 1,
    "dateTime": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Ошибки:**
- `500 Internal Server Error` - Ошибка при получении данных
```json
{
  "message": "Ошибка при получении данных о загрязнении",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X GET http://localhost:3001/api/pollutions
```

---

### 3. Статьи (`/api/articles`)

#### 3.1 Создание статьи

**POST** `/api/articles`

Создает новую статью в базе данных.

**Тело запроса:**
```json
{
  "title": "Заголовок статьи",
  "short_desc": "Краткое описание статьи",
  "description": "Полное описание статьи с детальной информацией"
}
```

**Параметры:**
- `title` (string, обязательный) - Заголовок статьи
- `short_desc` (string, опциональный) - Краткое описание статьи
- `description` (string, обязательный) - Полное описание статьи

**Успешный ответ:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Ошибки:**
- `400 Bad Request` - Отсутствуют обязательные поля
```json
{
  "message": "Необходимо указать заголовок и описание статьи"
}
```

- `500 Internal Server Error` - Ошибка при создании статьи
```json
{
  "message": "Ошибка при создании статьи",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Заголовок статьи",
    "short_desc": "Краткое описание",
    "description": "Полное описание статьи"
  }'
```

---

#### 3.2 Получение всех статей

**GET** `/api/articles`

Возвращает список всех статей в базе данных.

**Параметры запроса:** Нет

**Успешный ответ:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Заголовок статьи",
    "short_desc": "Краткое описание статьи",
    "description": "Полное описание статьи",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Ошибки:**
- `500 Internal Server Error` - Ошибка при получении списка статей
```json
{
  "message": "Ошибка при получении списка статей",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X GET http://localhost:3001/api/articles
```

---

#### 3.3 Получение статьи по ID

**GET** `/api/articles/:id`

Возвращает конкретную статью по её идентификатору.

**Параметры пути:**
- `id` (string, обязательный) - MongoDB ObjectId статьи

**Успешный ответ:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Заголовок статьи",
  "short_desc": "Краткое описание статьи",
  "description": "Полное описание статьи",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Ошибки:**
- `404 Not Found` - Статья не найдена
```json
{
  "message": "Статья не найдена"
}
```

- `500 Internal Server Error` - Ошибка при получении статьи
```json
{
  "message": "Ошибка при получении статьи",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X GET http://localhost:3001/api/articles/507f1f77bcf86cd799439011
```

---

#### 3.4 Удаление статьи по ID

**DELETE** `/api/articles/:id`

Удаляет конкретную статью по её идентификатору.

**Параметры пути:**
- `id` (string, обязательный) - MongoDB ObjectId статьи

**Успешный ответ:** `204 No Content` (без тела ответа)

**Ошибки:**
- `404 Not Found` - Статья не найдена
```json
{
  "message": "Article not found"
}
```

- `500 Internal Server Error` - Внутренняя ошибка сервера
```json
{
  "message": "Internal server error",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X DELETE http://localhost:3001/api/articles/507f1f77bcf86cd799439011
```

---

#### 3.5 Удаление всех статей

**DELETE** `/api/articles`

Удаляет все статьи из базы данных.

**Параметры запроса:** Нет

**Успешный ответ:** `204 No Content` (без тела ответа)

**Ошибки:**
- `404 Not Found` - Нет статей для удаления
```json
{
  "message": "Nothing to delete!"
}
```

- `500 Internal Server Error` - Внутренняя ошибка сервера
```json
{
  "message": "Internal server error",
  "error": "Error details..."
}
```

**Пример запроса:**
```bash
curl -X DELETE http://localhost:3001/api/articles
```

---

## Коды состояния HTTP

API использует стандартные HTTP коды состояния:

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс успешно создан
- `204 No Content` - Успешный запрос без содержимого в ответе
- `400 Bad Request` - Неверный запрос (отсутствуют обязательные поля или неверный формат данных)
- `401 Unauthorized` - Неавторизованный доступ
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

---

## Структура данных

### Пользователь (User)
```typescript
{
  id: string;        // UUID v4
  email: string;     // Email адрес
  password: string;  // Пароль (хранится в открытом виде)
}
```

### Статья (Article)
```typescript
{
  id: string;              // MongoDB ObjectId (возвращается как id)
  title: string;           // Заголовок статьи
  short_desc?: string;      // Краткое описание (опционально)
  description: string;      // Полное описание
  created_at: Date;         // Дата создания
}
```

### Данные о загрязнении (Pollution)
```typescript
{
  _id: string;             // MongoDB ObjectId
  address: string;          // Адрес локации
  latitude: number;        // Широта
  longitude: number;       // Долгота
  components: {            // Компоненты загрязнения
    co: number;            // CO (углеродный монооксид)
    no: number;            // NO (оксид азота)
    no2: number;           // NO₂ (диоксид азота)
    o3: number;            // O₃ (озон)
    so2: number;           // SO₂ (диоксид серы)
    pm2_5: number;         // PM2.5 (мелкие частицы)
    pm10: number;          // PM10 (крупные частицы)
    nh3: number;           // NH₃ (аммиак)
  };
  aqi: number;             // Индекс качества воздуха
  dateTime: string;        // Дата и время измерения (ISO 8601)
  created_at: Date;        // Дата создания записи
}
```

---

## Ограничения и особенности

1. **База данных:**
   - Статьи и данные о загрязнении хранятся в MongoDB
   - Пользователи хранятся в памяти (не сохраняются между перезапусками сервера)

2. **Безопасность:**
   - Пароли хранятся в открытом виде (не рекомендуется для production)
   - Аутентификация не использует токены (stateless)
   - CORS настроен для работы с `http://localhost:3000`

3. **Формат дат:**
   - Все даты возвращаются в формате ISO 8601
   - MongoDB автоматически добавляет поле `created_at` при создании записей

4. **Идентификаторы:**
   - Пользователи используют UUID v4
   - Статьи и данные о загрязнении используют MongoDB ObjectId
   - В ответах API поле `_id` преобразуется в `id` для статей

---

## Примеры использования

### Полный цикл работы со статьями

```bash
# 1. Создание статьи
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новая статья",
    "short_desc": "Краткое описание",
    "description": "Полное описание статьи"
  }'

# Ответ: {"id": "507f1f77bcf86cd799439011"}

# 2. Получение всех статей
curl -X GET http://localhost:3001/api/articles

# 3. Получение конкретной статьи
curl -X GET http://localhost:3001/api/articles/507f1f77bcf86cd799439011

# 4. Удаление статьи
curl -X DELETE http://localhost:3001/api/articles/507f1f77bcf86cd799439011
```

### Работа с данными о загрязнении

```bash
# 1. Сохранение данных
curl -X POST http://localhost:3001/api/pollutions \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Москва",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "components": {
      "co": 201.94,
      "no": 0.18,
      "no2": 0.92,
      "o3": 68.66,
      "so2": 0.77,
      "pm2_5": 4.67,
      "pm10": 6.04,
      "nh3": 0.12
    },
    "aqi": 1,
    "dateTime": "2024-01-15T10:30:00Z"
  }'

# 2. Получение истории
curl -X GET http://localhost:3001/api/pollutions
```

---

## Переменные окружения

Для настройки API используются следующие переменные окружения:

- `SERVER_PORT` - Порт сервера (по умолчанию: 3001)
- `CLIENT_PORT` - Порт клиентского приложения для CORS (по умолчанию: 3000)
- `MONGO_URI` - URI подключения к MongoDB (по умолчанию: mongodb://localhost:27017)
- `DB_NAME` - Имя базы данных (по умолчанию: pollutionData)

---

## Версионирование

Текущая версия API: **v1** (неявная)

В будущем планируется добавление версионирования через префикс пути (например, `/api/v1/...`).

---

## Поддержка

При возникновении проблем или вопросов обращайтесь к разработчикам проекта.
