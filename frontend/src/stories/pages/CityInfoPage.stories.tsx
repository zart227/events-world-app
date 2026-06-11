import type { Meta, StoryObj } from '@storybook/react';
import CityInfoPage from '../../pages/CityInfoPage';
import { withAuth, withLayout, withPollutions } from '../decorators';
import { mockPollutionList } from '../fixtures/mockData';

const meta: Meta<typeof CityInfoPage> = {
  title: 'Pages/CityInfoPage',
  component: CityInfoPage,
  tags: ['autodocs'],
  decorators: [withAuth(true), withLayout(['/city-info'])],
};

export default meta;

type Story = StoryObj<typeof CityInfoPage>;

export const Empty: Story = {};

export const WithPollutionData: Story = {
  decorators: [withPollutions(mockPollutionList)],
};
