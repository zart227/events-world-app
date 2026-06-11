import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getTestApp, registerUser, truncateAll, type TestUser } from './helpers.js';

let app: Express;
let admin: TestUser;
let user: TestUser;

beforeAll(async () => {
  app = await getTestApp();
});

beforeEach(async () => {
  await truncateAll();
  admin = await registerUser(app, 'admin@test.local');
  user = await registerUser(app, 'user@test.local');
});

async function createArticle(
  token: string,
  title: string,
  description = 'Описание',
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({ title, short_desc: 'кратко', description })
    .expect(201);
  return res.body.id as string;
}

describe('Articles CRUD + роли', () => {
  it('создание без авторизации -> 401', async () => {
    await request(app).post('/api/articles').send({ title: 'x', description: 'y' }).expect(401);
  });

  it('создаёт статью с author_id текущего пользователя', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ title: 'Моя статья', description: 'текст' })
      .expect(201);
    expect(res.body.author_id).toBe(user.id);
  });

  it('возвращает статью по id и 404 для несуществующей', async () => {
    const id = await createArticle(user.accessToken, 'Заголовок');
    const res = await request(app).get(`/api/articles/${id}`).expect(200);
    expect(res.body.title).toBe('Заголовок');

    await request(app).get('/api/articles/00000000-0000-0000-0000-000000000000').expect(404);
  });

  it('пользователь может удалить свою статью, но не чужую (403)', async () => {
    const own = await createArticle(user.accessToken, 'Своя');
    const foreign = await createArticle(admin.accessToken, 'Чужая');

    await request(app)
      .delete(`/api/articles/${foreign}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);

    await request(app)
      .delete(`/api/articles/${own}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);
  });

  it('admin может удалить чужую статью', async () => {
    const id = await createArticle(user.accessToken, 'От пользователя');
    await request(app)
      .delete(`/api/articles/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);
  });

  it('удалить все статьи может только admin', async () => {
    await createArticle(user.accessToken, 'A');

    await request(app)
      .delete('/api/articles')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);

    await request(app)
      .delete('/api/articles')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);

    const list = await request(app).get('/api/articles').expect(200);
    expect(list.body.total).toBe(0);
  });

  it('пагинация и сортировка', async () => {
    for (let i = 1; i <= 12; i += 1) {
      await createArticle(user.accessToken, `Статья ${String(i).padStart(2, '0')}`);
    }

    const page2 = await request(app)
      .get('/api/articles')
      .query({ page: 2, limit: 5, sort: 'title:asc' })
      .expect(200);

    expect(page2.body.total).toBe(12);
    expect(page2.body.totalPages).toBe(3);
    expect(page2.body.items).toHaveLength(5);
    expect(page2.body.items[0].title).toBe('Статья 06');
  });

  it('полнотекстовый поиск с русской морфологией', async () => {
    await createArticle(user.accessToken, 'Про кактусы', 'Выращивание кактусов дома');
    await createArticle(user.accessToken, 'Про погоду', 'Дожди и ветер');

    const res = await request(app).get('/api/articles').query({ q: 'кактус' }).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe('Про кактусы');
  });

  it('валидация query-параметров (400 на отрицательную страницу)', async () => {
    await request(app).get('/api/articles').query({ page: -1 }).expect(400);
  });
});
