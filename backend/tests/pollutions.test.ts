import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { openWeatherMapClient } from '../src/clients/openweathermap.client.js';
import { getTestApp, registerUser, samplePollution, truncateAll, type TestUser } from './helpers.js';

vi.mock('../src/clients/openweathermap.client.js', () => ({
  openWeatherMapClient: {
    geocodeCity: vi.fn(),
    fetchAirPollution: vi.fn(),
  },
}));

const mockedClient = vi.mocked(openWeatherMapClient);

let app: Express;
let admin: TestUser;
let user: TestUser;

beforeAll(async () => {
  app = await getTestApp();
});

beforeEach(async () => {
  await truncateAll();
  vi.clearAllMocks();
  admin = await registerUser(app, 'admin@test.local');
  user = await registerUser(app, 'user@test.local');
});

describe('История загрязнений', () => {
  it('GET/POST требуют авторизации', async () => {
    await request(app).get('/api/pollutions').expect(401);
    await request(app).post('/api/pollutions').send(samplePollution).expect(401);
  });

  it('сохраняет запись и возвращает её в истории пользователя', async () => {
    await request(app)
      .post('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(samplePollution)
      .expect(201);

    const res = await request(app)
      .get('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      address: 'Москва',
      latitude: '55.75',
      longitude: '37.61',
      aqi: 2,
    });
  });

  it('пользователь видит только свою историю, admin — всю', async () => {
    await request(app)
      .post('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(samplePollution)
      .expect(201);
    await request(app)
      .post('/api/pollutions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ ...samplePollution, address: 'Питер' })
      .expect(201);

    const userHistory = await request(app)
      .get('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(userHistory.body).toHaveLength(1);

    const adminHistory = await request(app)
      .get('/api/pollutions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(adminHistory.body).toHaveLength(2);
  });

  it('очистка истории — только admin', async () => {
    await request(app)
      .delete('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);
    await request(app)
      .delete('/api/pollutions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);
  });

  it('невалидное тело -> 400', async () => {
    await request(app)
      .post('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ address: 'X' })
      .expect(400);
  });
});

describe('Прокси /api/pollutions/current с кэшированием', () => {
  beforeEach(() => {
    mockedClient.geocodeCity.mockResolvedValue({
      name: 'Kazan',
      localName: 'Казань',
      lat: 55.7887,
      lon: 49.1221,
      country: 'RU',
    });
    mockedClient.fetchAirPollution.mockResolvedValue({
      aqi: 3,
      components: samplePollution.components,
      dt: 1_750_000_000,
    });
  });

  it('возвращает данные по городу через OWM-клиент', async () => {
    const res = await request(app)
      .get('/api/pollutions/current')
      .query({ city: 'Казань' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      address: 'Казань',
      latitude: '55.7887',
      longitude: '49.1221',
      aqi: 3,
    });
    expect(mockedClient.geocodeCity).toHaveBeenCalledExactlyOnceWith('Казань');
    expect(mockedClient.fetchAirPollution).toHaveBeenCalledTimes(1);
  });

  it('повторный запрос отдается из Redis-кэша (OWM вызывается один раз)', async () => {
    await request(app)
      .get('/api/pollutions/current')
      .query({ city: 'Казань' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    await request(app)
      .get('/api/pollutions/current')
      .query({ city: 'Казань' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    // геокодинг и данные закэшированы — клиент вызван по одному разу
    expect(mockedClient.geocodeCity).toHaveBeenCalledTimes(1);
    expect(mockedClient.fetchAirPollution).toHaveBeenCalledTimes(1);
  });

  it('кэш по координатам общий для разных способов запроса', async () => {
    await request(app)
      .get('/api/pollutions/current')
      .query({ city: 'Казань' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    const byCoords = await request(app)
      .get('/api/pollutions/current')
      .query({ lat: 55.7887, lon: 49.1221, address: 'Казань (центр)' })
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(byCoords.body.address).toBe('Казань (центр)');
    expect(mockedClient.fetchAirPollution).toHaveBeenCalledTimes(1);
  });

  it('без city и координат -> 400, без токена -> 401', async () => {
    await request(app)
      .get('/api/pollutions/current')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(400);
    await request(app).get('/api/pollutions/current').query({ city: 'Казань' }).expect(401);
  });
});
