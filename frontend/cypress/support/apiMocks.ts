/// <reference types="cypress" />

type AuthFixture = {
  user: { id: string; email: string; role: string };
  accessToken: string;
};

type ArticleItem = {
  id: string;
  created_at: string;
  title: string;
  short_desc: string;
  description: string;
  author_id: string;
};

type ArticlesFixture = {
  items: ArticleItem[];
  page: {
    items: ArticleItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  newArticle: ArticleItem;
};

const apiUrl = () => `${Cypress.env('apiBaseUrl')}`;

export const setupAuthApiMocks = (auth?: AuthFixture) => {
  cy.fixture<AuthFixture>('auth').then((defaultAuth) => {
    const payload = auth ?? defaultAuth;

    cy.intercept('POST', `${apiUrl()}/auth/login`, {
      statusCode: 200,
      body: payload,
    }).as('authLogin');

    cy.intercept('POST', `${apiUrl()}/auth/register`, {
      statusCode: 201,
      body: payload,
    }).as('authRegister');

    cy.intercept('POST', `${apiUrl()}/auth/logout`, {
      statusCode: 204,
      body: {},
    }).as('authLogout');

    cy.intercept('POST', `${apiUrl()}/auth/refresh`, {
      statusCode: 200,
      body: payload,
    }).as('authRefresh');
  });
};

export const setupPollutionApiMocks = () => {
  cy.fixture('pollution').then((pollution) => {
    cy.intercept('GET', `${apiUrl()}/pollutions`, {
      statusCode: 200,
      body: pollution.history,
    }).as('getPollutions');

    cy.intercept('GET', `${apiUrl()}/pollutions/current*`, (req) => {
      const city = req.query.city as string | undefined;
      const body = city?.toLowerCase().includes('москв') ? pollution.moscow : pollution.kazan;

      req.reply({ statusCode: 200, body });
    }).as('getCurrentPollution');
  });
};

export const setupYandexGeocoderMock = () => {
  cy.fixture('yandex-geocode').then((geocode) => {
    cy.intercept('GET', 'https://geocode-maps.yandex.ru/**', {
      statusCode: 200,
      body: geocode,
    }).as('yandexGeocode');
  });
};

export const setupSubscriptionsApiMocks = () => {
  let subscriptions: Array<Record<string, string>> = [];

  cy.fixture('subscriptions').then((data) => {
    subscriptions = [...data.items];

    cy.intercept('GET', `${apiUrl()}/subscriptions`, (req) => {
      req.reply({ statusCode: 200, body: subscriptions });
    }).as('getSubscriptions');

    cy.intercept('POST', `${apiUrl()}/subscriptions`, (req) => {
      const sub = { ...data.newSubscription, city: req.body.city };
      subscriptions.push(sub);
      req.reply({ statusCode: 201, body: sub });
    }).as('createSubscription');

    cy.intercept('DELETE', `${apiUrl()}/subscriptions/*`, (req) => {
      const id = req.url.split('/').pop();
      subscriptions = subscriptions.filter((item) => item.id !== id);
      req.reply({ statusCode: 204, body: {} });
    }).as('deleteSubscription');
  });
};

export const setupArticlesApiMocks = () => {
  cy.fixture<ArticlesFixture>('articles').then((articles) => {
    let items = [...articles.items];

    const buildPage = (query: URLSearchParams) => {
      const page = Number(query.get('page') || 1);
      const limit = Number(query.get('limit') || 10);
      const sort = query.get('sort') || 'created_at:desc';
      const q = (query.get('q') || '').trim().toLowerCase();

      let filtered = [...items];
      if (q) {
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.short_desc || '').toLowerCase().includes(q),
        );
      }

      filtered.sort((a, b) => {
        if (sort === 'title:asc') return a.title.localeCompare(b.title);
        if (sort === 'title:desc') return b.title.localeCompare(a.title);
        if (sort === 'created_at:asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit);

      return {
        items: pageItems,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    };

    cy.intercept('GET', `${apiUrl()}/articles?*`, (req) => {
      const query = new URL(req.url).searchParams;
      req.reply({ statusCode: 200, body: buildPage(query) });
    }).as('getArticles');

    cy.intercept('GET', `${apiUrl()}/articles/*`, (req) => {
      const id = req.url.split('/articles/')[1]?.split('?')[0];
      const article = items.find((item) => item.id === id);
      if (!article) {
        req.reply({ statusCode: 404, body: { message: 'Not found' } });
        return;
      }
      req.reply({ statusCode: 200, body: article });
    }).as('getArticle');

    cy.intercept('POST', `${apiUrl()}/articles`, (req) => {
      const created = {
        ...articles.newArticle,
        ...req.body,
        id: `article-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      items = [created, ...items];
      req.reply({ statusCode: 201, body: created });
    }).as('createArticle');

    cy.intercept('DELETE', `${apiUrl()}/articles/*`, (req) => {
      const id = req.url.split('/articles/')[1]?.split('?')[0];
      items = items.filter((item) => item.id !== id);
      req.reply({ statusCode: 204, body: {} });
    }).as('deleteArticle');

    cy.intercept('DELETE', `${apiUrl()}/articles`, () => {
      items = [];
    }).as('deleteAllArticles');
  });
};

export const setupCommonApiMocks = () => {
  setupAuthApiMocks();
  setupPollutionApiMocks();
  setupYandexGeocoderMock();
  setupSubscriptionsApiMocks();
  setupArticlesApiMocks();
};
