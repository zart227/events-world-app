import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db/pool.js';
import { extractRefreshCookie, getTestApp, registerUser, truncateAll } from './helpers.js';

let app: Express;

beforeAll(async () => {
  app = await getTestApp();
});

beforeEach(async () => {
  await truncateAll();
});

describe('Auth flow', () => {
  it('регистрирует пользователя: 201, accessToken, httpOnly refresh cookie, user_settings в транзакции', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.local', password: 'password123' })
      .expect(201);

    expect(res.body.user).toMatchObject({ email: 'new@test.local', role: 'user' });
    expect(res.body.accessToken).toBeTruthy();

    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('refreshToken='),
    );
    expect(cookie).toContain('HttpOnly');

    const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [
      res.body.user.id,
    ]);
    expect(rows).toHaveLength(1);
  });

  it('выдаёт роль admin для email из ADMIN_EMAILS', async () => {
    const admin = await registerUser(app, 'admin@test.local');
    expect(admin.role).toBe('admin');
  });

  it('хранит пароль в виде bcrypt-хэша', async () => {
    const user = await registerUser(app, 'hash@test.local');
    const { rows } = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id],
    );
    expect(rows[0]!.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('возвращает 409 при повторной регистрации', async () => {
    await registerUser(app, 'dup@test.local');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.local', password: 'password123' })
      .expect(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('валидирует входные данные (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '1' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('логинит с верным паролем и отклоняет неверный (401)', async () => {
    await registerUser(app, 'login@test.local', 'correct-pass');

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.local', password: 'correct-pass' })
      .expect(200);
    expect(ok.body.accessToken).toBeTruthy();

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.local', password: 'wrong-pass!' })
      .expect(401);
  });

  it('ротация refresh: новый токен работает, старый отозван, повторное использование отзывает все сессии', async () => {
    const user = await registerUser(app, 'rotate@test.local');

    // первая ротация
    const r1 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', user.refreshCookie)
      .expect(200);
    const rotatedCookie = extractRefreshCookie(r1);
    expect(rotatedCookie).not.toBe(user.refreshCookie);

    // повторное использование старого (украденного) токена -> 401 и отзыв всех сессий
    await request(app).post('/api/auth/refresh').set('Cookie', user.refreshCookie).expect(401);

    // даже новый токен теперь отозван
    await request(app).post('/api/auth/refresh').set('Cookie', rotatedCookie).expect(401);
  });

  it('logout отзывает refresh-токен', async () => {
    const user = await registerUser(app, 'logout@test.local');

    await request(app).post('/api/auth/logout').set('Cookie', user.refreshCookie).expect(204);
    await request(app).post('/api/auth/refresh').set('Cookie', user.refreshCookie).expect(401);
  });

  it('logout-all отзывает все сессии пользователя', async () => {
    const user = await registerUser(app, 'all@test.local');
    const second = await request(app)
      .post('/api/auth/login')
      .send({ email: 'all@test.local', password: 'password123' })
      .expect(200);
    const secondCookie = extractRefreshCookie(second);

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    await request(app).post('/api/auth/refresh').set('Cookie', user.refreshCookie).expect(401);
    await request(app).post('/api/auth/refresh').set('Cookie', secondCookie).expect(401);
  });

  it('refresh без cookie -> 401', async () => {
    await request(app).post('/api/auth/refresh').expect(401);
  });
});
