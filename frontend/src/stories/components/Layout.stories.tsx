import type { Meta, StoryObj } from '@storybook/react';
import AppLayout from '../../components/Layout/Layout';
import { withAuth, withLayout } from '../decorators';

const PageContent = () => (
  <div>
    <h1>Контент страницы</h1>
    <p>Пример содержимого внутри общего макета приложения.</p>
  </div>
);

const meta: Meta<typeof AppLayout> = {
  title: 'Components/Layout',
  component: AppLayout,
  tags: ['autodocs'],
  decorators: [withAuth(false), withLayout(['/about'])],
  render: () => <PageContent />,
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Guest: Story = {};

export const Authenticated: Story = {
  decorators: [withAuth(true), withLayout(['/location'])],
};
