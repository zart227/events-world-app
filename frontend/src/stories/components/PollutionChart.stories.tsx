import type { Meta, StoryObj } from '@storybook/react';
import PollutionChart from '../../components/PollutionChart/PollutionChart';
import { mockPollutionList } from '../fixtures/mockData';

const meta: Meta<typeof PollutionChart> = {
  title: 'Components/PollutionChart',
  component: PollutionChart,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PollutionChart>;

export const SingleCity: Story = {
  args: {
    data: [mockPollutionList[0]],
  },
};

export const MultipleCities: Story = {
  args: {
    data: mockPollutionList,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};
