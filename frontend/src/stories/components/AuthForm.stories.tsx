import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import AuthForm from '../../components/Form/AuthForm';

const meta: Meta<typeof AuthForm> = {
  title: 'Components/AuthForm',
  component: AuthForm,
  tags: ['autodocs'],
  args: {
    onFinish: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof AuthForm>;

export const Login: Story = {
  args: {
    mode: 'login',
  },
};

export const Register: Story = {
  args: {
    mode: 'register',
  },
};
