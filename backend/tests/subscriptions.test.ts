import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { openWeatherMapClient } from '../src/clients/openweathermap.client.js';
import { refreshSubscribedCities } from '../src/jobs/pollution-refresh.job.js';
import { samplePollution, getTestApp, registerUser, truncateAll, type TestUser } from './helpers.js';

vi.mock('../src/clients/openweathermap.client.js', () => ({
  openWeatherMapClient: {
    geocodeCity: vi.fn(),
    fetchAirPollution: vi.fn(),
  },
}));

const mockedClient = vi.mocked(openWeatherMapClient);

let app: Express;
let user: TestUser;

beforeAll(async () => {
  app = await getTestApp();
});

beforeEach(async () => {
  await truncateAll();
  vi.clearAllMocks();
  user = await registerUser(app, 'subs@test.local');
  mockedClient.geocodeCity.mockResolvedValue({
    name: 'Kazan',
    localName: 'Казань',
    lat: 55.7887,
    lon: 49.1221,
    country: 'RU',
  });
  mockedClient.fetchAirPollution.mockResolvedValue({
    aqi: 4,
    components: samplePollution.components,
    dt: 1_750_000_000,
  });
});

describe('Подписки на города', () => {
  it('создаёт подписку и не даёт подписаться дважды (409)', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ city: 'Казань' })
      .expect(201);
    expect(res.body).toMatchObject({ city: 'Казань' });

    await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ city: 'Казань' })
      .expect(409);
  });

  it('список и удаление подписки', async () => {
    const created = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ city: 'Казань' })
      .expect(201);

    const list = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(list.body).toHaveLength(1);

    await request(app)
      .delete(`/api/subscriptions/${created.body.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    const after = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(after.body).toHaveLength(0);
  });

  it('фоновая задача пишет историю подписчикам', async () => {
    await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ city: 'Казань' })
      .expect(201);

    await refreshSubscribedCities();

    const history = await request(app)
      .get('/api/pollutions')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(history.body).toHaveLength(1);
    expect(history.body[0]).toMatchObject({ address: 'Казань', aqi: 4 });
  });

  it('требует авторизации', async () => {
    await request(app).get('/api/subscriptions').expect(401);
  });
});
