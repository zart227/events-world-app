import type { Meta, StoryObj } from '@storybook/react';
import LocationInputPage from '../../pages/LocationInputPage';
import { withAuth, withLayout } from '../decorators';

const meta: Meta<typeof LocationInputPage> = {
  title: 'Pages/LocationInputPage',
  component: LocationInputPage,
  tags: ['autodocs'],
  decorators: [withAuth(true), withLayout(['/location'])],
};

export default meta;

type Story = StoryObj<typeof LocationInputPage>;

export const Empty: Story = {};
