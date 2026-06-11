import type { Meta, StoryObj } from '@storybook/react';
import Error404Page from '../../pages/Error404Page';
import { withLayout } from '../decorators';

const meta: Meta<typeof Error404Page> = {
  title: 'Pages/Error404Page',
  component: Error404Page,
  tags: ['autodocs'],
  decorators: [withLayout(['/not-found'])],
};

export default meta;

type Story = StoryObj<typeof Error404Page>;

export const Default: Story = {};
