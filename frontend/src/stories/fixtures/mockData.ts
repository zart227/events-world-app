import { ArticlesPage, CombinedData, ArticleType } from '../../types/types';

export const mockPollutionData: CombinedData = {
  address: 'Москва, Красная площадь',
  latitude: '55.7539',
  longitude: '37.6208',
  aqi: 2,
  dateTime: '2024-06-01T12:00:00',
  components: {
    co: 230.5,
    no: 0.5,
    no2: 12.3,
    o3: 45.2,
    so2: 2.1,
    pm2_5: 15.4,
    pm10: 25.8,
    nh3: 1.2,
  },
};

export const mockPollutionList: CombinedData[] = [
  mockPollutionData,
  {
    ...mockPollutionData,
    address: 'Санкт-Петербург, Дворцовая площадь',
    latitude: '59.9386',
    longitude: '30.3141',
    aqi: 3,
    dateTime: '2024-06-02T14:30:00',
    components: {
      ...mockPollutionData.components,
      pm2_5: 28.1,
      no2: 22.7,
    },
  },
];

export const mockArticles: ArticleType[] = [
  {
    id: '1',
    title: 'Качество воздуха в городах',
    short_desc: 'Обзор основных показателей загрязнения',
    description: 'Первая строка статьи.\nВторая строка статьи.',
    created_at: '2024-06-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Как читать индекс AQI',
    short_desc: 'Краткое руководство по индексу качества воздуха',
    description: 'AQI помогает оценить уровень загрязнения.',
    created_at: '2024-06-02T10:00:00Z',
  },
];

export const mockArticlesPage: ArticlesPage = {
  items: mockArticles,
  total: mockArticles.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};
