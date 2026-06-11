import type { Meta, StoryObj } from '@storybook/react';
import ArticleCreatePage from '../../pages/Articles/ArticleCreatePage';
import { withAuth, withLayout, withRedux } from '../decorators';

const meta: Meta<typeof ArticleCreatePage> = {
  title: 'Pages/ArticleCreatePage',
  component: ArticleCreatePage,
  tags: ['autodocs'],
  decorators: [withAuth(true), withRedux(), withLayout(['/articles/create'])],
};

export default meta;

type Story = StoryObj<typeof ArticleCreatePage>;

export const Default: Story = {};
