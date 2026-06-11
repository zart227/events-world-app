import type { Meta, StoryObj } from '@storybook/react';
import AboutPage from '../../pages/AboutPage';
import { withLayout } from '../decorators';

const meta: Meta<typeof AboutPage> = {
  title: 'Pages/AboutPage',
  component: AboutPage,
  tags: ['autodocs'],
  decorators: [withLayout(['/about'])],
};

export default meta;

type Story = StoryObj<typeof AboutPage>;

export const Default: Story = {};
