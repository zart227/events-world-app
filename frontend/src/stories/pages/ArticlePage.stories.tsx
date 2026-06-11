import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticlePage from '../../pages/Articles/ArticlePage';
import AppLayout from '../../components/Layout/Layout';
import { withArticle, withAuth } from '../decorators';
import { mockArticles } from '../fixtures/mockData';

const meta: Meta<typeof ArticlePage> = {
  title: 'Pages/ArticlePage',
  component: ArticlePage,
  tags: ['autodocs'],
  decorators: [
    withAuth(true),
    withArticle(mockArticles[0], '1'),
    () => (
      <MemoryRouter initialEntries={['/articles/1']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/articles/:id" element={<ArticlePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ArticlePage>;

export const Default: Story = {};
