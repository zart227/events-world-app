import type { Meta, StoryObj } from '@storybook/react';
import ArticlesListPage from '../../pages/Articles/ArticlesListPage';
import { withArticles, withAuth, withLayout } from '../decorators';
import { mockArticlesPage } from '../fixtures/mockData';

const meta: Meta<typeof ArticlesListPage> = {
  title: 'Pages/ArticlesListPage',
  component: ArticlesListPage,
  tags: ['autodocs'],
  decorators: [
    withAuth(true),
    withLayout(['/articles']),
    withArticles(mockArticlesPage),
  ],
};

export default meta;

type Story = StoryObj<typeof ArticlesListPage>;

export const Default: Story = {};

export const Empty: Story = {
  decorators: [
    withArticles({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
  ],
};
