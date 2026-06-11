import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import LocationInputForm from '../../components/Form/LocationInputForm';

const meta: Meta<typeof LocationInputForm> = {
  title: 'Components/LocationInputForm',
  component: LocationInputForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof LocationInputForm>;

export const Default: Story = {};
